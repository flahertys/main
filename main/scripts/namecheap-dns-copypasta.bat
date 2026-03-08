@echo off
setlocal

REM Wrapper for PowerShell Namecheap DNS helper
REM Usage:
REM   namecheap-dns-copypasta.bat print
REM   namecheap-dns-copypasta.bat verify
REM   namecheap-dns-copypasta.bat api
REM   namecheap-dns-copypasta.bat guide

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%namecheap-dns-copypasta.ps1"
set "CMD=%~1"

if "%CMD%"=="" set "CMD=print"

if /I "%CMD%"=="guide" goto :guide

if not exist "%PS_SCRIPT%" (
  echo ERROR: Missing script: "%PS_SCRIPT%"
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -Command %CMD%
exit /b %ERRORLEVEL%

:guide
echo.
echo Namecheap Advanced DNS click-by-click guide for tradehax.net
echo.
echo 1^) Log in to Namecheap and open Domain List.
echo 2^) Click Manage next to tradehax.net.
echo 3^) Open the Advanced DNS tab.
echo 4^) Delete existing records for host @ and www.
echo 5^) Add this record:
echo    Type: CNAME
echo    Host: @
echo    Value: cname.vercel-dns.com
echo    TTL: Automatic
echo 6^) Add this record:
echo    Type: CNAME
echo    Host: www
echo    Value: cname.vercel-dns.com
echo    TTL: Automatic
echo 7^) Save all changes and wait 5-30 minutes for propagation.
echo 8^) Verify from terminal:
echo    namecheap-dns-copypasta.bat verify
echo.
exit /b 0
