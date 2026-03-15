[CmdletBinding()]
param(
    [string]$RepoPath = "C:\tradez\main",
    [string]$MainBranch = "main",
    [string[]]$ReviewBranches = @("backup-before-pin-069c31c", "copilot-worktree-2026-03-01T04-53-03"),
    [string]$RemoteName = "origin",
    [string]$Since = "midnight",
    [switch]$DeployRemote,
    [switch]$UseDocker,
    [bool]$DryRun = $true,
    [string]$VpsHost = $env:TRADEHAX_VPS_HOST,
    [string]$VpsUser = $env:TRADEHAX_VPS_USER,
    [string]$SshKeyPath = $env:TRADEHAX_SSH_KEY_PATH,
    [string]$RemoteAppPath = $env:TRADEHAX_REMOTE_APP_PATH,
    [string]$Pm2AppName = $(if ($env:TRADEHAX_PM2_APP_NAME) { $env:TRADEHAX_PM2_APP_NAME } else { "tradehax" }),
    [string]$DockerComposeFile = $(if ($env:TRADEHAX_DOCKER_COMPOSE_FILE) { $env:TRADEHAX_DOCKER_COMPOSE_FILE } else { "docker-compose.social.yml" }),
    [string]$DockerProjectName = $env:TRADEHAX_DOCKER_PROJECT,
    [string]$DockerServices = $env:TRADEHAX_DOCKER_SERVICES,
    [string]$HealthCheckUrl = $(if ($env:TRADEHAX_HEALTH_URL) { $env:TRADEHAX_HEALTH_URL } else { "https://tradehax.net/__health" }),
    [int]$HealthCheckRetries = $(if ($env:TRADEHAX_HEALTH_RETRIES) { [int]$env:TRADEHAX_HEALTH_RETRIES } else { 5 }),
    [int]$HealthCheckTimeoutSec = $(if ($env:TRADEHAX_HEALTH_TIMEOUT_SEC) { [int]$env:TRADEHAX_HEALTH_TIMEOUT_SEC } else { 15 }),
    [int]$HealthCheckRetryDelaySec = $(if ($env:TRADEHAX_HEALTH_RETRY_DELAY_SEC) { [int]$env:TRADEHAX_HEALTH_RETRY_DELAY_SEC } else { 5 })
)

$ErrorActionPreference = "Stop"

$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
if (-not [System.IO.Path]::IsPathRooted($DockerComposeFile)) {
    $DockerComposeFile = Join-Path $RepoPath $DockerComposeFile
}

function Invoke-GitRead {
    param([string[]]$GitArgs)
    $output = & git -C $RepoPath @GitArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed: $output"
    }
    return @($output)
}

function Invoke-GitWrite {
    param([string[]]$GitArgs)
    $cmd = "git -C `"$RepoPath`" $($GitArgs -join ' ')"
    if ($DryRun) {
        Write-Host "[DRY-RUN] $cmd"
        return
    }

    Write-Host "[RUN] $cmd"
    & git -C $RepoPath @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git write command failed: $cmd"
    }
}

function Test-BranchExists {
    param([string]$Branch)
    & git -C $RepoPath show-ref --verify --quiet "refs/heads/$Branch"
    return $LASTEXITCODE -eq 0
}

function Get-TodaysCommits {
    param([string]$Branch)
    return Invoke-GitRead -GitArgs @("log", $Branch, "--since=$Since", "--oneline")
}

function Get-BranchCommitsNotInMain {
    param([string]$Branch)
    return Invoke-GitRead -GitArgs @("log", "$MainBranch..$Branch", "--since=$Since", "--oneline")
}

function Invoke-HealthCheck {
    if ([string]::IsNullOrWhiteSpace($HealthCheckUrl)) {
        throw "Health check URL is empty. Set -HealthCheckUrl or TRADEHAX_HEALTH_URL."
    }

    if ($DryRun) {
        Write-Host "[DRY-RUN] health-check $HealthCheckUrl (retries=$HealthCheckRetries timeout=${HealthCheckTimeoutSec}s delay=${HealthCheckRetryDelaySec}s)"
        return
    }

    $lastError = $null
    for ($attempt = 1; $attempt -le $HealthCheckRetries; $attempt++) {
        try {
            Write-Host "[RUN] Health check attempt $attempt/$HealthCheckRetries -> $HealthCheckUrl"
            $response = Invoke-WebRequest -Uri $HealthCheckUrl -Method Get -TimeoutSec $HealthCheckTimeoutSec -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "[OK] Health check passed (HTTP 200)."
                return
            }

            $lastError = "unexpected status code $($response.StatusCode)"
            Write-Host "[WARN] Health check failed: $lastError"
        }
        catch {
            $lastError = $_.Exception.Message
            Write-Host "[WARN] Health check request error: $lastError"
        }

        if ($attempt -lt $HealthCheckRetries) {
            Start-Sleep -Seconds $HealthCheckRetryDelaySec
        }
    }

    throw "Health check failed after $HealthCheckRetries attempts: $lastError"
}

if (-not (Test-Path -LiteralPath $RepoPath)) {
    throw "Repo path not found: $RepoPath"
}

Write-Host "Repository: $RepoPath"
Write-Host "Main branch: $MainBranch"
Write-Host "Review branches: $($ReviewBranches -join ', ')"
Write-Host "Since: $Since"
Write-Host "DryRun: $DryRun"
Write-Host "UseDocker: $UseDocker"
Write-Host "HealthCheckUrl: $HealthCheckUrl"
Write-Host ""

$workingTree = Invoke-GitRead -GitArgs @("status", "--porcelain")
if ($workingTree.Count -gt 0 -and ($workingTree -join "").Trim().Length -gt 0) {
    throw "Working tree is not clean. Commit or stash local changes before deployment."
}

Invoke-GitWrite -GitArgs @("fetch", "--all", "--prune")
Invoke-GitWrite -GitArgs @("checkout", $MainBranch)
Invoke-GitWrite -GitArgs @("pull", "--ff-only", $RemoteName, $MainBranch)

Write-Host "=== Today's commits ==="
$allBranches = @($MainBranch) + $ReviewBranches
foreach ($branch in $allBranches) {
    if (-not (Test-BranchExists -Branch $branch)) {
        Write-Host "[$branch] branch not found locally (skipped)."
        continue
    }

    Write-Host "[$branch]"
    $commits = Get-TodaysCommits -Branch $branch
    if ($commits.Count -eq 0 -or ($commits -join "").Trim().Length -eq 0) {
        Write-Host "  (no commits since $Since)"
    }
    else {
        $commits | ForEach-Object { Write-Host "  $_" }
    }
}

$branchesToMerge = @()
foreach ($branch in $ReviewBranches) {
    if (-not (Test-BranchExists -Branch $branch)) {
        continue
    }

    $delta = Get-BranchCommitsNotInMain -Branch $branch
    if ($delta.Count -gt 0 -and ($delta -join "").Trim().Length -gt 0) {
        $branchesToMerge += $branch
    }
}

if ($branchesToMerge.Count -eq 0) {
    Write-Host ""
    Write-Host "No merge required. No review branch has new commits not already in $MainBranch since $Since."
}
else {
    Write-Host ""
    Write-Host "Branches queued for merge: $($branchesToMerge -join ', ')"

    foreach ($branch in $branchesToMerge) {
        Invoke-GitWrite -GitArgs @("merge", "--no-ff", "--no-edit", $branch)
    }

    Invoke-GitWrite -GitArgs @("push", $RemoteName, $MainBranch)
}

if ($DeployRemote) {
    if ([string]::IsNullOrWhiteSpace($VpsHost) -or
        [string]::IsNullOrWhiteSpace($VpsUser) -or
        [string]::IsNullOrWhiteSpace($SshKeyPath) -or
        [string]::IsNullOrWhiteSpace($RemoteAppPath)) {
        throw "Remote deploy requested but TRADEHAX_VPS_* settings are incomplete."
    }

    if ($UseDocker) {
        $composeArgs = "-f $DockerComposeFile"
        if (-not [string]::IsNullOrWhiteSpace($DockerProjectName)) {
            $composeArgs += " -p $DockerProjectName"
        }

        $serviceArgs = ""
        if (-not [string]::IsNullOrWhiteSpace($DockerServices)) {
            $serviceArgs = " $DockerServices"
        }

        $remoteCommand = "cd $RemoteAppPath && git pull $RemoteName $MainBranch && if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then COMPOSE='docker compose'; else COMPOSE='docker-compose'; fi && `$COMPOSE $composeArgs pull$serviceArgs && `$COMPOSE $composeArgs up -d --build$serviceArgs && `$COMPOSE $composeArgs ps"
    }
    else {
        $remoteCommand = "cd $RemoteAppPath && git pull $RemoteName $MainBranch && npm install && npm run build && pm2 restart $Pm2AppName"
    }

    if ($DryRun) {
        Write-Host "[DRY-RUN] ssh -i $SshKeyPath $VpsUser@$VpsHost \"$remoteCommand\""
    }
    else {
        Write-Host "[RUN] Remote deploy on $VpsHost"
        & ssh -i $SshKeyPath "$VpsUser@$VpsHost" $remoteCommand
        if ($LASTEXITCODE -ne 0) {
            throw "Remote deployment failed on $VpsHost"
        }
    }

    Invoke-HealthCheck
}

Write-Host ""
Write-Host "Done."
