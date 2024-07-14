@echo off
setlocal enabledelayedexpansion

:: Extract version from package.json
for /f "tokens=4 delims=:, " %%i in ('findstr "version" package.json') do (
    set VERSION=%%i
    set VERSION=!VERSION:"=!
    goto :break
)
:break

:: Use PowerShell to replace the version in installer.iss
PowerShell -Command "(Get-Content installer.iss) -replace '#define MyAppVersion \".*\"', '#define MyAppVersion \"' + '!VERSION!' + '\"' | Set-Content installer.iss"

echo Version updated to !VERSION! in installer.iss
