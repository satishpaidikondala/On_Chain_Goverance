#!/bin/sh
# Start hardhat node in background
npx hardhat node &
NODE_PID=$!

# Wait for node to be ready
echo "Waiting for Hardhat node to start..."
sleep 5

# Deploy contracts
echo "Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

echo "Contracts deployed! Node is running."

# Keep the node process in foreground
wait $NODE_PID
