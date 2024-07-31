@echo off
setlocal enabledelayedexpansion

:: Extract version from package.json
for /f "tokens=2 delims=:, " %%i in ('findstr "\"version\"" package.json') do (
    echo Found version line: %%i
    set VERSION=%%i
    set VERSION=!VERSION:"=!
    set VERSION=!VERSION: =!
    echo Extracted version: !VERSION!
    goto :break
)
:break

:: Check if VERSION is set
if "%VERSION%"=="" (
    echo Failed to extract version from package.json
    exit /b 1
)

:: Use PowerShell to replace the version in installer.iss
PowerShell -Command "(Get-Content 'installer.iss') -replace '#define MyAppVersion \".*\"', '#define MyAppVersion \"%VERSION%\"' | Set-Content 'installer.iss'"

echo Version updated to %VERSION% in installer.iss
