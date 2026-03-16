@echo off
REM Deployment script for Windows
REM Usage: deploy.bat [deploy-staging|deploy-prod|status|logs]

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%\..

if "%1"=="" (
    echo Usage: %~nx0 [deploy-staging^|deploy-prod^|status^|logs]
    echo.
    echo Commands:
    echo   deploy-staging    Deploy to staging environment
    echo   deploy-prod       Deploy to production environment
    echo   status            Show deployment status
    echo   logs              Show service logs
    exit /b 0
)

if "%1"=="deploy-staging" (
    echo [INFO] Deploying to staging...
    if not exist .env.staging (
        echo [ERROR] .env.staging not found
        exit /b 1
    )
    docker compose -f docker-compose.staging.yml --env-file .env.staging down --remove-orphans
    docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
    docker compose -f docker-compose.staging.yml --env-file .env.staging ps
    exit /b 0
)

if "%1"=="deploy-prod" (
    echo [INFO] Deploying to production...
    if not exist .env.production (
        echo [ERROR] .env.production not found
        exit /b 1
    )
    docker compose -f docker-compose.prod.yml --env-file .env.production down --remove-orphans
    docker compose -f docker-compose.prod.yml --env-file .env.production up -d
    docker compose -f docker-compose.prod.yml --env-file .env.production ps
    exit /b 0
)

if "%1"=="status" (
    echo [INFO] Staging services:
    docker compose -f docker-compose.staging.yml ps 2>nul || echo Not deployed
    echo [INFO] Production services:
    docker compose -f docker-compose.prod.yml ps 2>nul || echo Not deployed
    exit /b 0
)

if "%1"=="logs" (
    set ENV=%2
    if "!ENV!"=="" set ENV=staging
    docker compose -f docker-compose.!ENV!.yml logs -f --tail=100
    exit /b 0
)

echo [ERROR] Unknown command: %1
exit /b 1
