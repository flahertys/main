#!/bin/bash
# Bash Universal Sync & Bypass Automation Script
# Reads config from sync-config.json

CONFIG_PATH="$(dirname "$0")/sync-config.json"
if [ ! -f "$CONFIG_PATH" ]; then
  echo "[ERROR] Config file not found: $CONFIG_PATH"
  exit 1
fi

# Read config values
local_repo_path=$(jq -r .local_repo_path "$CONFIG_PATH")
cloud_repo_url=$(jq -r .cloud_repo_url "$CONFIG_PATH")
cloud_env_ssh=$(jq -r .cloud_env_ssh "$CONFIG_PATH")
cloud_env_path=$(jq -r .cloud_env_path "$CONFIG_PATH")
env_file=$(jq -r .env_file "$CONFIG_PATH")
backup_dir=$(jq -r .backup_dir "$CONFIG_PATH")
log_file=$(jq -r .log_file "$CONFIG_PATH")
branch=$(jq -r .branch "$CONFIG_PATH")
perm_env_file=$(jq -r .permissions.env_file "$CONFIG_PATH")

# Ensure backup dir exists
mkdir -p "$backup_dir"
cd "$local_repo_path" || exit 1
backup_name="repo-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar czf "$backup_dir/$backup_name" .git

echo "[INFO] Backup created at $backup_dir/$backup_name" | tee -a "$log_file"

# Clean git history (remove secrets)
if ! command -v git-filter-repo &>/dev/null; then
  echo "[ERROR] git-filter-repo not installed. Install with: pip install git-filter-repo" | tee -a "$log_file"
  exit 1
fi

git filter-repo --path "$env_file" --invert-paths --force

echo "[INFO] Removed $env_file from git history." | tee -a "$log_file"

git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo "[INFO] Cleaned up git history." | tee -a "$log_file"

git remote set-url origin "$cloud_repo_url"
git fetch origin
git pull origin "$branch" --allow-unrelated-histories
git push origin "$branch" --force
echo "[INFO] Local and cloud repositories synchronized." | tee -a "$log_file"

# Sync .env file
scp "$env_file" "$cloud_env_ssh:$cloud_env_path/$env_file"
# Optionally, pull cloud .env to local (uncomment if needed)
# scp "$cloud_env_ssh:$cloud_env_path/$env_file" "$local_repo_path/$env_file"
echo "[INFO] .env file synchronized between local and cloud." | tee -a "$log_file"

# Set permissions
chmod "$perm_env_file" "$local_repo_path/$env_file"
ssh "$cloud_env_ssh" "chmod $perm_env_file $cloud_env_path/$env_file"
echo "[INFO] Permissions set for .env files." | tee -a "$log_file"

# Endpoint sync extension point
# Add API/webhook sync here as needed

echo "[SUCCESS] All synchronization steps completed." | tee -a "$log_file"

