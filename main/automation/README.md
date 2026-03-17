# Universal Sync & Bypass Automation Framework

This framework automates:
- Bypassing push protection and cleaning secrets from git history
- Bi-directional synchronization of local and cloud repositories
- Synchronization of .env and other sensitive files
- Setting permissions for all endpoints
- Logging all actions for audit

## Structure
- `sync-all.ps1` — PowerShell script for Windows
- `sync-all.sh` — Bash script for Unix
- `sync-config.json` — Central configuration for endpoints, credentials, and paths
- `sync-log.txt` — Log file (auto-generated)

## Usage
1. Edit `sync-config.json` to match your environment (paths, repo URLs, SSH info, etc.)
2. Run the appropriate script for your OS:
   - **Windows:**
     ```powershell
     powershell -ExecutionPolicy Bypass -File automation/sync-all.ps1
     ```
   - **Unix/Linux/macOS:**
     ```bash
     bash automation/sync-all.sh
     ```
3. All actions are logged to `sync-log.txt`.

## Extending
- Add new endpoints (API/webhooks, additional files) by editing `sync-config.json` and extending the scripts.
- Scripts are modular and reference the config file for all operations.

## Requirements
- Python and `git-filter-repo` installed
- SSH/SCP access to cloud environment
- Git access to both local and cloud repositories

## Security
- All sensitive files are backed up before destructive actions
- Permissions are set according to config
- All actions are logged

---

**This framework is designed to be robust, extensible, and production-ready.**

