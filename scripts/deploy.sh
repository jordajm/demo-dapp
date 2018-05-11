#!/bin/sh

# NOTE: This script requires `ipfs daemon` to be running locally

echo "\nLooking for local IPFS daemon..."
while ! curl --silent --output /dev/null localhost:5001; do
  sleep 1
done

# First run webpack
npm run build

# Add build directory to local ipfs. Extract directory hash from last line
HASH=$(ipfs add -r build | tail -n 1 | cut -d ' ' -f 2)

echo "\nPushing to https://gateway.originprotocol.com..."

# Pin directory hash and children to Origin IPFS server
echo "https://gateway.originprotocol.com:5002/api/v0/pin/add?arg=$HASH" | xargs curl --silent --output /dev/null

echo "https://gateway.originprotocol.com/ipfs/$HASH" | xargs curl --silent --output /dev/null

echo "\nDeployed to https://gateway.originprotocol.com/ipfs/$HASH\n"
