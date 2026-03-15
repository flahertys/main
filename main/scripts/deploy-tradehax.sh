#!/bin/bash

# Check for changes in source folders and push/commit/deploy
FOLDERS="app/ src/ components/ lib/ hooks/ types/ ai/"

if [[ -n $(git status -s $FOLDERS) ]]; then
    echo "Found uncommitted changes. Committing..."
    git add $FOLDERS
    git commit -m "Auto-commit: AI-assisted changes $(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    echo "Changes pushed to repository."
else
    echo "No uncommitted changes found in source folders."
fi

echo "Triggering Vercel deployment..."
vercel --prod --confirm

echo "Deployment triggered!"

