param(
  [string]$CanonicalPath = "C:\tradez\main",
  [string]$MirrorPath = "C:\DarkModder33\main"
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
  param(
    [Parameter(Mandatory = $true)][string]$RepoPath,
    [Parameter(Mandatory = $true)][string[]]$Args
  )

  $output = & git -C $RepoPath @Args 2>$null
  if ($LASTEXITCODE -ne 0) {
    return @()
  }
  return @($output)
}

function Show-Repo {
  param(
    [Parameter(Mandatory = $true)][string]$Role,
    [Parameter(Mandatory = $true)][string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Host "[$Role] $Path (missing)"
    return
  }

  $branch = (Invoke-Git -RepoPath $Path -Args @("rev-parse", "--abbrev-ref", "HEAD")) | Select-Object -First 1
  $commit = (Invoke-Git -RepoPath $Path -Args @("rev-parse", "--short", "HEAD")) | Select-Object -First 1
  $statusLines = Invoke-Git -RepoPath $Path -Args @("status", "--short")

  Write-Host "[$Role] $Path"
  Write-Host "  branch: $branch"
  Write-Host "  commit: $commit"
  if ($statusLines.Count -eq 0) {
    Write-Host "  worktree: clean"
  } else {
    Write-Host "  worktree: dirty ($($statusLines.Count) changes)"
  }

  $remoteLines = Invoke-Git -RepoPath $Path -Args @("remote", "-v")
  if ($remoteLines.Count -gt 0) {
    Write-Host "  remotes:"
    foreach ($line in $remoteLines) {
      Write-Host "    $line"
    }
  }

  Write-Host ""
}

Write-Host "TradeHax Local Repository Topology"
Write-Host ""
Show-Repo -Role "canonical" -Path $CanonicalPath
Show-Repo -Role "mirror" -Path $MirrorPath
