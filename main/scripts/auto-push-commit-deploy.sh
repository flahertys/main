#!/bin/bash
# Automated script to push, commit, and deploy changes for tradehax.net
set -e

echo "[1/4] Adding all changes..."
git add .

echo "[2/4] Committing changes..."
git commit -m "Automated: push, commit, and deploy all changes for domain and endpoint integration"

echo "[3/4] Pushing to remote repository..."
git push

echo "[4/4] Triggering Vercel production deployment..."
vercel --prod

echo "✅ All done!"

