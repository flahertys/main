<#
Windows-friendly cleanup script for Next.js workspace
Removes common build caches and temporary folders.
#>

Write-Host "Cleaning Next.js build artifacts and caches..."

$paths = @('.next','out','node_modules/.cache')

foreach ($p in $paths) {
  if (Test-Path $p) {
    try {
      Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction Stop
      Write-Host "Removed: $p"
    } catch {
      Write-Warning ("Failed to remove {0}: {1}" -f $p, ${_})
    }
  } else {
    Write-Host "Not found (skipping): $p"
  }
}

Write-Host "Cleanup complete."
