@echo off

REM Get the directory where this batch script is located
set "SCRIPT_DIR=%~dp0"

REM Construct the path to the runtime bin folder relative to this script
set "RUNTIME_BIN_PATH=%SCRIPT_DIR%runtime\win_x64\bin"

REM Add the runtime bin folder to the PATH for this script's instance and its children
set "PATH=%RUNTIME_BIN_PATH%;%PATH%"
node src/main.js
