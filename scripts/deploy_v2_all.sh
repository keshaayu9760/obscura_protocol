#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <private-key> [endpoint]"
  exit 1
fi

PRIVATE_KEY="$1"
ENDPOINT="${2:-https://api.explorer.provable.com/v1}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../contract" && pwd)"
BROADCAST_URL="$ENDPOINT/testnet/transaction/broadcast"
SNARKOS_BIN="${SNARKOS_BIN:-$HOME/.cargo/bin/snarkos}"

if [[ ! -x "$SNARKOS_BIN" ]]; then
  echo "snarkos binary not found at $SNARKOS_BIN"
  exit 1
fi

deploy_program() {
  local dir="$1"
  local program="$2"

  echo "DEPLOY_START $program"
  cd "$ROOT/$dir"
  "$SNARKOS_BIN" developer deploy \
    "$program" \
    --private-key "$PRIVATE_KEY" \
    --query "$ENDPOINT" \
    --broadcast "$BROADCAST_URL" \
    --path ./build/ \
    --priority-fee 1000000
  echo "DEPLOY_DONE $program"
}

deploy_program "obscura_v2_0" "obscura_v2_0.aleo"
deploy_program "obscura_v2_0_cx" "obscura_v2_0_cx.aleo"
deploy_program "obscura_v2_0_sd" "obscura_v2_0_sd.aleo"
