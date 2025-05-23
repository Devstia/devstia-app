:: --- Compile Devstia.exe Launcher ---
echo Building Devstia.exe Launcher

:: Copy files to build directory
if not exist "..\build\launcher" (
    mkdir ..\build\launcher
)
copy /Y Devstia.c ..\build\launcher\Devstia.c
copy /Y Devstia.rc ..\build\launcher\Devstia.rc
copy /Y ..\images\icon.ico ..\build\launcher\icon.ico
cd ..\build\launcher
rc.exe /fo Devstia.res Devstia.rc
echo Compiling resource file Devstia.rc to Devstia.res...
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to compile resource file Devstia.rc.
    cd ..
    exit /b 1
)

echo Compiling C code and linking (Devstia.c with Devstia.res)...
cl Devstia.c Devstia.res /FeDevstia.exe /W4 /O2 /link /SUBSYSTEM:WINDOWS Shlwapi.lib
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to compile or link Devstia.exe.
    cd ..
    exit /b 1
) else (
    echo Devstia.exe compiled successfully with custom icon.
)
cd ..
echo Devstia.exe built