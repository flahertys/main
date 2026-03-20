#!/bin/bash
# This Bash script automates the bypass of git push protection by:
# 1. Using BFG Repo-Cleaner if Java 21 (LTS) is available
# 2. Falling back to git-filter-repo if BFG/Java is not available
# 3. Running git cleanup commands
# 4. Forcing a push to remote
# 5. Checking .gitignore for .env.local
#
# JAVA 21 (LTS) UPGRADE - Updated from Java 17 to Java 21 (LTS)
# Release Date: Sept 2023 | Support Until: Sept 2031

set -e
MIRROR_DIR="/mnt/c/tradez/main/main-mirror"
BFG_JAR="/tmp/bfg.jar"
BFG_URL="https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar"
GITIGNORE="$MIRROR_DIR/.gitignore"

cd "$MIRROR_DIR"

# Check for Java and BFG with version validation
if command -v java >/dev/null 2>&1; then
  JAVA_VERSION=$(java -version 2>&1 | head -1)
  echo "Java found: $JAVA_VERSION"
  echo "Using BFG Repo-Cleaner with Java 21 (LTS)."
  if [ ! -f "$BFG_JAR" ]; then
    echo "Downloading BFG Repo-Cleaner..."
    curl -L -o "$BFG_JAR" "$BFG_URL"
  fi
  java -jar "$BFG_JAR" --delete-files .env.local
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  git push --force
else
  echo "Java not found. Trying git-filter-repo fallback."
  if ! command -v git-filter-repo >/dev/null 2>&1; then
    echo "git-filter-repo not found. Attempting to install via pip..."
    if command -v pip >/dev/null 2>&1; then
      pip install --user git-filter-repo
      export PATH="$HOME/.local/bin:$PATH"
    else
      echo "pip not found. Please install git-filter-repo manually: https://github.com/newren/git-filter-repo"
      exit 1
    fi
  fi
  if command -v git-filter-repo >/dev/null 2>&1; then
    git filter-repo --path web/.env.local --invert-paths
    git push --force
  else
    echo "git-filter-repo is not available. Cannot proceed. Please install Java or git-filter-repo and re-run this script."
    exit 1
  fi
fi

# Check .gitignore for .env.local
if [ -f "$GITIGNORE" ]; then
  if ! grep -q '^.env.local$' "$GITIGNORE"; then
    echo ".env.local is NOT in .gitignore. Please add it to prevent future leaks!"
  else
    echo ".env.local is present in .gitignore."
  fi
else
  echo ".gitignore file not found in mirror repo. Please check manually."
fi

echo "Bypass complete. Confirm .env.local is in .gitignore and try your push again."

