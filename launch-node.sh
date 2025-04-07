#!/bin/bash

# Start local testnet node in background
aptos node run-local-testnet --with-indexer-api --force-restart --assume-yes &
NODE_PID=$!

# Ensure the node is stopped when the script exits or is interrupted
cleanup() {
  echo "Shutting down local testnet node..."
  kill $NODE_PID
  wait $NODE_PID 2>/dev/null
}
trap cleanup EXIT

# Wait for node to be ready
echo "Waiting for local testnet to be ready..."
# check faucet
until curl -s http://127.0.0.1:8081 > /dev/null; do
  sleep 1
done
echo "Local testnet is ready."
sleep 2

# Funding account
echo "Funding accounts"
aptos account fund-with-faucet --amount 200000000
aptos move run --function-id 0x1::coin::migrate_to_fungible_store --type-args 0x1::aptos_coin::AptosCoin --assume-yes
aptos account create --account "$MVMT_DEV_WALLET" --assume-yes
aptos move run --function-id 0x1::primary_fungible_store::transfer --type-args 0x1::fungible_asset::Metadata --args address:"0xa" address:"$MVMT_DEV_WALLET" u64:100000000 --assume-yes

WALLET="0x17d1169c2f4e744ea21495510702cae3eba2230e928713bc07ae7c611cd1269b"
# Deploy your Move package
echo "Deploying Inertia and Coin packages..."
aptos move publish --named-addresses inertia=$WALLET --assume-yes

echo "Deploying USDK stablecoin..."
aptos move publish --package-dir ./stablecoin --named-addresses stablecoin=$WALLET,master_minter=$WALLET,minter=$WALLET,pauser=$WALLET,denylister=$WALLET --assume-yes

echo "Mint INT and USDK"
aptos move run --function-id $WALLET::usdk::mint --args address:"$MVMT_DEV_WALLET" u64:100000000 --assume-yes
aptos move run --function-id $WALLET::inertia_coin::mint --args address:"$MVMT_DEV_WALLET" u64:100000000 --assume-yes

echo "Verifying contract deployment..."
if ! aptos move view --function-id 0x17d1169c2f4e744ea21495510702cae3eba2230e928713bc07ae7c611cd1269b::inertia_coin::get_metadata --profile default > /dev/null; then
  echo "Contract verification failed. Shutting down..."
  exit 1  # triggers the EXIT trap for cleanup
fi

echo "Contracts deployed and verified successfully."

# Keep script running to allow interaction with the node
echo "Node running. Press Ctrl+C to exit."
# Option A: Block with tail (can be swapped with `read` if preferred)
tail -f /dev/null