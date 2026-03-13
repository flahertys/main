@echo off
REM Batch Backup Script for TradeHax
REM Archives source code, environment files, handshake scripts, configs, and generates endpoint documentation

setlocal
set TIMESTAMP=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%-%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set BACKUPDIR=..\tradehax-backup-%TIMESTAMP%

REM Create backup directory
mkdir "%BACKUPDIR%"

REM 1. Archive web directory (excluding node_modules, dist, secrets)
xcopy . "%BACKUPDIR%\web" /E /I /EXCLUDE:backup-exclude.txt

REM 2. Copy environment files
mkdir "%BACKUPDIR%\env"
if exist .env.production copy .env.production "%BACKUPDIR%\env\"
if exist .env.local copy .env.local "%BACKUPDIR%\env\"
if exist .env.example copy .env.example "%BACKUPDIR%\env\"

REM 3. Copy handshake scripts
mkdir "%BACKUPDIR%\scripts"
if exist scripts\handshake-check.js copy scripts\handshake-check.js "%BACKUPDIR%\scripts\"
if exist scripts\supabase-health.mjs copy scripts\supabase-health.mjs "%BACKUPDIR%\scripts\"
if exist scripts\api-smoke.js copy scripts\api-smoke.js "%BACKUPDIR%\scripts\"

REM 4. Copy deployment configs
mkdir "%BACKUPDIR%\config"
if exist vercel.json copy vercel.json "%BACKUPDIR%\config\"
if exist package.json copy package.json "%BACKUPDIR%\config\"

REM 5. Export endpoint documentation
copy BACKUP_README.md "%BACKUPDIR%\BACKUP_README.md"

REM 6. Notify user
@echo Backup complete! Archive located at: %BACKUPDIR%
endlocal
