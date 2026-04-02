#!/bin/bash
# Obscura Protocol - Initialize Protocol
# Calls the initialize() transition to set admin and protocol params
set -euo pipefail

if [ -z "${PRIVATE_KEY:-}" ]; then
  echo "ERROR: PRIVATE_KEY environment variable is required."
  exit 1
fi

NETWORK="${NETWORK:-testnet}"
ENDPOINT="${ENDPOINT:-https://api.explorer.provable.com/v1}"

echo "Initializing Obscura Protocol protocol..."

snarkos developer execute \
  obscura_protocol_v7.aleo \
  initialize \
  --private-key "$PRIVATE_KEY" \
  --query "$ENDPOINT" \
  --broadcast "$ENDPOINT/$NETWORK/transaction/broadcast" \
  --priority-fee 100000

echo "Protocol initialized successfully!"
echo "Admin address set to the deployer's address."
