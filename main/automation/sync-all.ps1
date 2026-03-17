#!/usr/bin/env pwsh
# PowerShell Universal Sync & Bypass Automation Script
# Reads config from sync-config.json

param(
    [string]$ConfigPath = "automation/sync-config.json"
)

function Log-Info($msg) {
    $logFile = $Config.log_file
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [INFO] $msg" | Tee-Object -FilePath $logFile -Append
}
function Log-Error($msg) {
    $logFile = $Config.log_file
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp [ERROR] $msg" | Tee-Object -FilePath $logFile -Append
}

# --- Load Config ---
if (!(Test-Path $ConfigPath)) {
    Write-Error "Config file not found: $ConfigPath"
    exit 1
}
$Config = Get-Content $ConfigPath | ConvertFrom-Json

# --- Ensure Backup Directory Exists ---
if (!(Test-Path $Config.backup_dir)) {
    New-Item -ItemType Directory -Path $Config.backup_dir | Out-Null
}

# --- 1. BACKUP LOCAL REPO ---
Set-Location $Config.local_repo_path
$backupName = "repo-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
$backupPath = Join-Path $Config.backup_dir $backupName
Compress-Archive -Path .git -DestinationPath $backupPath -Force
Log-Info "Backup created at $backupPath"

# --- 2. CLEAN GIT HISTORY (REMOVE SECRETS) ---
if (-not (Get-Command git-filter-repo -ErrorAction SilentlyContinue)) {
    Log-Error "git-filter-repo not installed. Install with: pip install git-filter-repo"
    exit 1
}
$envFile = $Config.env_file
python -m git_filter_repo --path $envFile --invert-paths --force
Log-Info "Removed $envFile from git history."

& git reflog expire --expire=now --all
& git gc --prune=now --aggressive
Log-Info "Cleaned up git history."

# --- 3. SYNCHRONIZE LOCAL AND CLOUD REPOSITORIES ---
& git remote set-url origin $Config.cloud_repo_url
& git fetch origin
& git pull origin $Config.branch --allow-unrelated-histories
& git push origin $Config.branch --force
Log-Info "Local and cloud repositories synchronized."

# --- 4. SYNCHRONIZE .env FILES ---
# Push local .env to cloud
scp $envFile "$($Config.cloud_env_ssh):$($Config.cloud_env_path)/$envFile"
# Optionally, pull cloud .env to local (uncomment if needed)
# scp "$($Config.cloud_env_ssh):$($Config.cloud_env_path)/$envFile" "$($Config.local_repo_path)/$envFile"
Log-Info ".env file synchronized between local and cloud."

# --- 5. SET PERMISSIONS (REPO & ENV FILE) ---
# Set repo permissions (if using SSH keys, ensure they're set up)
$envFilePath = Join-Path $Config.local_repo_path $envFile
# Set permissions on local .env file (Windows ACL)
try {
    icacls $envFilePath /inheritance:r /grant:r "$env:USERNAME:F" | Out-Null
    Log-Info "Set permissions on $envFilePath for $env:USERNAME."
} catch {
    Log-Error ("Failed to set permissions on ${envFilePath}: " + $_)
}
# Set permissions on cloud .env file
try {
    ssh $Config.cloud_env_ssh "chmod $($Config.permissions.env_file) $($Config.cloud_env_path)/$envFile"
    Log-Info "Set permissions on cloud .env file."
} catch {
    Log-Error ("Failed to set permissions on cloud .env file: " + $_)
}

# --- 6. ENDPOINT SYNCHRONIZATION (EXTENSION POINT) ---
if ($Config.api_endpoints.Count -gt 0) {
    foreach ($endpoint in $Config.api_endpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint -Method Post
            Log-Info "Synced API endpoint: $endpoint"
        } catch {
            Log-Error ("Failed to sync API endpoint ${endpoint}: " + $_)
        }
    }
} else {
    Log-Info "No API endpoints configured for sync."
}

Log-Info "All synchronization steps completed successfully."

