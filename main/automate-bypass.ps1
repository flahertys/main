# This PowerShell script automates the bypass of git push protection by:
# 1. Installing OpenJDK 21 (LTS) (Temurin) if not present
# 2. Downloading BFG Repo-Cleaner
# 3. Running BFG to remove .env.local and related files from git history
# 4. Running git cleanup commands
# 5. Forcing a push to remote
#
# JAVA 21 (LTS) UPGRADE - Updated from Java 17 to Java 21 (LTS)
# Release Date: Sept 2023 | Support Until: Sept 2031

$ErrorActionPreference = 'Stop'

# Set variables
$jdkUrl = "https://github.com/adoptium/temurin21-binaries/releases/latest/download/OpenJDK21U-jdk_x64_windows_hotspot.msi"
$jdkInstaller = "$env:TEMP\OpenJDK21.msi"
$bfgUrl = "https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar"
$bfgJar = "$env:TEMP\bfg.jar"
$mirrorDir = "C:\tradez\main\main-mirror"

# 1. Install Java if not present
Write-Host "Checking for Java..."
$java = Get-Command java -ErrorAction SilentlyContinue
$useBFG = $true
if (-not $java) {
    Write-Host "Java not found. Downloading and installing OpenJDK..."
    $maxRetries = 3
    $retryCount = 0
    $success = $false
    while (-not $success -and $retryCount -lt $maxRetries) {
        try {
            Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkInstaller
            $success = $true
        } catch {
            $retryCount++
            Write-Host "Download failed. Retrying ($retryCount/$maxRetries)..."
            Start-Sleep -Seconds 3
        }
    }
    if (-not $success) {
        Write-Host "Automatic download failed after $maxRetries attempts. Will try git-filter-repo fallback."
        $useBFG = $false
    } else {
        Start-Process msiexec.exe -Wait -ArgumentList "/i `"$jdkInstaller`" /qn /norestart"
        # Update PATH for Java 21
        $env:Path += ";C:\Program Files\Eclipse Adoptium\jdk-21.0.0.0-hotspot\bin"
        # Set JAVA_HOME environment variable for Java 21
        [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.0.0-hotspot", "User")
        Write-Host "OpenJDK 21 (LTS) installed and JAVA_HOME configured."
    }
} else {
    Write-Host "Java is already installed."
}

if ($useBFG) {
    # 2. Download BFG Repo-Cleaner
    Write-Host "Downloading BFG Repo-Cleaner..."
    try {
        Invoke-WebRequest -Uri $bfgUrl -OutFile $bfgJar
        # 3. Run BFG to delete .env.local and related files
        Write-Host "Running BFG to clean .env.local and related files from git history..."
        Set-Location $mirrorDir
        java -jar $bfgJar --delete-files .env.local
        # 4. Git cleanup
        Write-Host "Running git cleanup commands..."
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        git push --force
        $bfgSuccess = $true
    } catch {
        Write-Host "BFG failed. Will try git-filter-repo fallback."
        $bfgSuccess = $false
    }
} else {
    $bfgSuccess = $false
}

if (-not $bfgSuccess) {
    # Try git-filter-repo fallback
    Write-Host "Checking for git-filter-repo..."
    $gfr = Get-Command git-filter-repo -ErrorAction SilentlyContinue
    if (-not $gfr) {
        Write-Host "git-filter-repo not found. Attempting to install via pip..."
        try {
            pip install git-filter-repo
            $gfr = Get-Command git-filter-repo -ErrorAction SilentlyContinue
        } catch {
            Write-Host "pip install failed. Please install git-filter-repo manually: https://github.com/newren/git-filter-repo"
            exit 1
        }
    }
    if ($gfr) {
        Write-Host "Running git-filter-repo to remove web/.env.local..."
        Set-Location $mirrorDir
        git filter-repo --path web/.env.local --invert-paths
        git push --force
    } else {
        Write-Host "git-filter-repo is not available. Cannot proceed. Please install Java or git-filter-repo and re-run this script."
        exit 1
    }
}

# Check .gitignore for .env.local
$gitignorePath = Join-Path $mirrorDir ".gitignore"
if (Test-Path $gitignorePath) {
    $giContent = Get-Content $gitignorePath
    if ($giContent -notcontains ".env.local") {
        Write-Host ".env.local is NOT in .gitignore. Please add it to prevent future leaks!"
    } else {
        Write-Host ".env.local is present in .gitignore."
    }
} else {
    Write-Host ".gitignore file not found in mirror repo. Please check manually."
}

Write-Host "Bypass complete. Confirm .env.local is in .gitignore and try your push again."
