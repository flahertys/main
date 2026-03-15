#!/bin/bash

# Step 1: Push, Commit, Deploy
./scripts/deploy-tradehax.sh

# Step 2: DNS Forward Check
./scripts/check-dns.sh

# Step 3: nmap Network Check
./scripts/nmap-check.sh

echo "All steps completed. If you see no errors, deployment and DNS are correct."

