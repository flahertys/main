param(
  [string]$CanonicalPath = "C:\tradez\main",
  [string]$MirrorPath = "C:\DarkModder33\main"
)

$ErrorActionPreference = "Stop"

function Invoke-GitOrThrow {
  param(
    [Parameter(Mandatory = $true)][string]$RepoPath,
    [Parameter(Mandatory = $true)][string[]]$Args
  )

  & git -C $RepoPath @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git -C $RepoPath $($Args -join ' ') failed."
  }
}

if (-not (Test-Path -LiteralPath $CanonicalPath)) {
  throw "Canonical path not found: $CanonicalPath"
}

if (-not (Test-Path -LiteralPath $MirrorPath)) {
  throw "Mirror path not found: $MirrorPath"
}

$mirrorStatus = @(& git -C $MirrorPath status --porcelain)
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect mirror status at $MirrorPath."
}

if ($mirrorStatus.Count -gt 0) {
  throw "Mirror repo has uncommitted changes. Commit or stash them before sync."
}

$remotes = @(& git -C $MirrorPath remote)
if ($LASTEXITCODE -ne 0) {
  throw "Unable to list remotes in mirror repo."
}

if ($remotes -notcontains "canonical_local") {
  Invoke-GitOrThrow -RepoPath $MirrorPath -Args @("remote", "add", "canonical_local", $CanonicalPath)
}

Invoke-GitOrThrow -RepoPath $MirrorPath -Args @("fetch", "canonical_local", "main")
Invoke-GitOrThrow -RepoPath $MirrorPath -Args @("checkout", "main")
Invoke-GitOrThrow -RepoPath $MirrorPath -Args @("merge", "--ff-only", "canonical_local/main")

Write-Host "Mirror sync complete."
Write-Host "Canonical: $CanonicalPath"
Write-Host "Mirror:    $MirrorPath"
