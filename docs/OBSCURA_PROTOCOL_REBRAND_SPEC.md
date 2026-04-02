# Obscura Protocol Rebrand and Upgrade Spec

## Objectives

- Rebrand the product to `Obscura Protocol`.
- Preserve the existing prediction-market engine and Aleo workflow.
- Introduce a new public contract family under `obscura_protocol_v7*.aleo`.
- Replace the legacy orange/glass identity with a colder, more deliberate visual system.
- Normalize repo naming so frontend, backend, docs, and contracts all point to the same generation.

## Brand System

- Product name: `Obscura Protocol`
- Short product noun: `Obscura`
- Fast-cycle markets: `Eclipse Rounds`
- Main Aleo program: `obscura_protocol_v7.aleo`
- USDCx companion program: `obscura_protocol_v7_cx.aleo`
- USAD companion program: `obscura_protocol_v7_sd.aleo`

## Visual Direction

- Tone: tactical, nocturnal, instrument-grade, less hype-driven
- Primary accent: spectral cyan
- Secondary accent: brass
- Base surfaces: ink, graphite, fog
- Heading font: `Sora`
- Body font: `Manrope`
- Mono font: `IBM Plex Mono`

## Contract Upgrade Direction

- Preserve the existing market engine, AMM flow, dispute flow, privacy model, and governance flow.
- Move the codebase to branded v7 program identifiers.
- Rename internal/local variables and comments to be more domain-shaped and less placeholder-like.
- Add low-risk extension surfaces that do not remove existing behavior:
  - protocol pause state mapping
  - market dossier hash mapping
  - resolver registry transition on the governance program

## Repo Sweep

- Replace brand references in frontend, backend, docs, scripts, package manifests, HTML metadata, and public copy.
- Replace public program identifiers across frontend and backend config.
- Update README/docs examples to the new program IDs and vocabulary.
- Reset stale wording around the legacy round terminology to `Eclipse Rounds`.

## Delivery Shape

- Spec doc committed in-repo
- Updated frontend visual system
- Updated public copy and package identity
- Updated Leo program names and manifests
- Updated backend program wiring
- Remaining real-world deployment tasks left documented for post-code execution
