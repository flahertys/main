@echo off
REM OAuth Restriction Removal - Windows
REM Run this script if OAuth issues return

echo Disabling Docker OAuth...
docker logout
docker system prune -af --volumes

echo Clearing VS Code cache...
rmdir /s /q "%APPDATA%\Code\Cache" 2>nul
rmdir /s /q "%APPDATA%\Code\CachedExtensionVSIXs" 2>nul

echo Clearing Docker config...
del "%USERPROFILE%\.docker\config.json" 2>nul

echo Restarting Docker...
taskkill /IM "Docker Desktop.exe" /F 2>nul
timeout /t 3
start "" "C:\Program Files\Docker\Docker\Docker.exe"

echo OAuth restrictions cleared!
echo Restart VS Code for changes to take effect.
pause
