#!/usr/bin/env python3
"""
Transform Leo 3.x contracts to Leo 4.0 syntax.

Key changes:
1. async transition foo() -> (..., Future)  =>  fn foo() -> (..., Final)
2. External calls: program.aleo/func  =>  program.aleo::func
3. Future type  =>  Final type
4. .await()  =>  .run()
5. async function foo_finalize(params) { body }  =>  merged into final { body } with variable substitution
6. Remove @noupgrade async constructor() {}
7. Variables passed to finalize must be substituted with their values from the transition
"""

import re
import sys

def transform_leo4(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Fix program name (v2.0 -> v2_0 for Leo identifier rules)
    content = content.replace('obscura_v2.0', 'obscura_v2_0')
    
    # 2. Replace external call syntax
    content = re.sub(r'(\w+\.aleo)/', r'\1::', content)
    
    # 3. Remove @noupgrade async constructor
    content = re.sub(r'\s*@noupgrade\s*\n\s*async constructor\(\)\s*\{\s*\}\s*\n', '\n', content)
    
    # 4. Replace Future with Final in types
    content = content.replace(': Future', ': Final')
    content = content.replace('-> Future', '-> Final')
    content = content.replace('Future =', 'Final =')
    
    # 5. Replace .await() with .run()
    content = content.replace('.await()', '.run()')
    
    # 6. Rename transfer_future to transfer_final for consistency
    content = content.replace('transfer_future', 'transfer_final')
    
    # 7. Replace "async transition" with "fn"
    content = re.sub(r'async transition ', 'fn ', content)
    
    # 8. Parse the file to find transition/finalize pairs
    # We need to:
    #  a) Extract each finalize function
    #  b) Determine the parameter mapping (finalize param -> transition variable)
    #  c) Inline finalize body into transition with substitutions
    
    # Find all transitions and their finalize calls
    transition_pattern = r'fn (\w+)\s*\([^)]*\)[^{]*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}'
    
    # Find all async function finalize definitions with their bodies
    finalize_defs = {}
    finalize_pattern = r'async function (\w+)\s*\(\s*([^)]*)\s*\)\s*\{'
    
    pos = 0
    while True:
        match = re.search(finalize_pattern, content[pos:])
        if not match:
            break
        
        func_name = match.group(1)
        params_str = match.group(2)
        start = pos + match.end()
        
        # Parse parameters
        params = []
        if params_str.strip():
            for param in params_str.split(','):
                param = param.strip()
                if ':' in param:
                    pname = param.split(':')[0].strip()
                    params.append(pname)
        
        # Find matching closing brace
        brace_count = 1
        body_start = start
        i = start
        while brace_count > 0 and i < len(content):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
            i += 1
        
        body = content[body_start:i-1]
        full_start = pos + match.start()
        full_end = i
        
        finalize_defs[func_name] = {
            'params': params,
            'body': body,
            'full_start': full_start,
            'full_end': full_end
        }
        
        pos = full_end
    
    print(f"Found {len(finalize_defs)} finalize functions")
    
    # Now process each finalize function
    # We need to:
    # 1. Find where it's called: return (..., func_name(args));
    # 2. Extract the call arguments
    # 3. Create a mapping: param_name -> arg_expression
    # 4. Substitute in the body
    # 5. Replace the return statement with return (..., final { substituted_body });
    # 6. Remove the async function definition
    
    # Process from end to beginning to maintain string positions
    replacements = []
    
    for func_name, data in finalize_defs.items():
        # Find the call pattern: return (..., func_name(args)); OR return func_name(args);
        call_pattern = rf'return\s+\(([^;]+?),\s*{re.escape(func_name)}\s*\(([^)]*)\)\s*\)\s*;'
        call_pattern_simple = rf'return\s+{re.escape(func_name)}\s*\(([^)]*)\)\s*;'
        
        for match in re.finditer(call_pattern, content):
            other_returns = match.group(1)
            args_str = match.group(2)
            
            # Parse arguments
            args = [a.strip() for a in args_str.split(',') if a.strip()]
            
            # Create mapping
            param_to_arg = {}
            for i, param in enumerate(data['params']):
                if i < len(args):
                    param_to_arg[param] = args[i]
            
            # Substitute in body
            substituted_body = data['body']
            
            # Common substitutions for our contracts
            # creator -> self.signer
            # caller -> self.signer  
            # token_type -> TOKEN_ALEO (for main contract)
            special_subs = {
                'creator': 'self.signer',
                'caller': 'self.signer',
            }
            
            for param, arg in param_to_arg.items():
                if param in special_subs and arg == 'self.signer':
                    substituted_body = re.sub(rf'\b{param}\b', special_subs[param], substituted_body)
                elif param == 'token_type' and arg == 'TOKEN_ALEO':
                    substituted_body = re.sub(rf'\b{param}\b', 'TOKEN_ALEO', substituted_body)
                # For transfer_final, keep as is since it's defined in scope
            
            # Clean up body formatting
            lines = substituted_body.strip().split('\n')
            formatted_body = '\n'.join('            ' + line.strip() for line in lines if line.strip())
            
            # Create new return statement
            new_return = f'''return ({other_returns}, final {{
{formatted_body}
        }});'''
            
            replacements.append({
                'start': match.start(),
                'end': match.end(),
                'new': new_return
            })
        
        # Handle simple returns (no other values)
        for match in re.finditer(call_pattern_simple, content):
            args_str = match.group(1)
            args = [a.strip() for a in args_str.split(',') if a.strip()]
            
            param_to_arg = {}
            for i, param in enumerate(data['params']):
                if i < len(args):
                    param_to_arg[param] = args[i]
            
            substituted_body = data['body']
            for param, arg in param_to_arg.items():
                if param in ['creator', 'caller'] and 'self.signer' in arg:
                    substituted_body = re.sub(rf'\b{param}\b', 'self.signer', substituted_body)
                elif param == 'token_type':
                    substituted_body = re.sub(rf'\b{param}\b', arg, substituted_body)
            
            lines = substituted_body.strip().split('\n')
            formatted_body = '\n'.join('            ' + line.strip() for line in lines if line.strip())
            
            new_return = f'''return final {{
{formatted_body}
        }};'''
            
            replacements.append({
                'start': match.start(),
                'end': match.end(),
                'new': new_return
            })
        
        # Mark finalize function for removal
        replacements.append({
            'start': data['full_start'],
            'end': data['full_end'],
            'new': f'// {func_name} merged into its transition'
        })
    
    # Apply replacements from end to start
    replacements.sort(key=lambda x: x['start'], reverse=True)
    
    for r in replacements:
        content = content[:r['start']] + r['new'] + content[r['end']:]
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Transformed {input_file} -> {output_file}")
    print(f"Applied {len(replacements)} transformations")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python leo4_transform.py <input_file> [output_file]")
        sys.exit(1)
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file
    transform_leo4(input_file, output_file)
