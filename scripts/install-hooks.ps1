<#
.SYNOPSIS
  Install repository git hooks by setting `core.hooksPath` to `.githooks`

.DESCRIPTION
  This small helper sets the local repo config `core.hooksPath` to `.githooks`,
  adds the `pre-commit` hook to the index (if present) and marks it executable
  in the git index so Git will run it locally on Windows and POSIX clones.

  Run this from the repository root:

    pwsh .\scripts\install-hooks.ps1

  The script is idempotent and safe to re-run.
#>

param(
    [switch]$Force
)

function Write-Ok($msg){ Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }

# Ensure we're in a git repository
if (-not (Test-Path .git)) {
    Write-Warn "No .git folder found. Run this from the repository root."
    exit 1
}

Write-Host "Setting git config: core.hooksPath -> .githooks"
git config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) { Write-Warn "git config failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }
Write-Ok "core.hooksPath set to .githooks"

# Create hooks dir if missing
if (-not (Test-Path -Path '.githooks')) {
    Write-Host "Creating .githooks directory..."
    New-Item -ItemType Directory -Path '.githooks' | Out-Null
    Write-Ok "Created .githooks"
}

$hook = '.githooks/pre-commit'
if (Test-Path -Path $hook) {
    Write-Host "Adding $hook to git index and setting executable bit..."
    git add $hook
    git update-index --chmod=+x $hook
    if ($LASTEXITCODE -ne 0) { Write-Warn "Could not update index chmod for $hook (exit $LASTEXITCODE)" }
    else { Write-Ok "Marked $hook executable in git index" }
} else {
    Write-Warn "No pre-commit hook found at $hook. Create it and re-run this script."
}

Write-Host "
Done. To enable hooks for other clones, instruct collaborators to run:

  git config core.hooksPath .githooks

Or run this script locally to apply the same change.
"

exit 0
