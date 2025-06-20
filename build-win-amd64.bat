:: Check if Visual Studio Build Environment is running
if "%VSINSTALLDIR%"=="" (
    echo "Please run this script from the Start -> Developer Command Prompt."
    exit /b
) else (
    echo Visual Studio Build Environment is detected.
)

:: Check for qemu installation (installed from https://github.com/virtuosoft-dev/devstia-vm)
if not exist "C:\Program Files\qemu\qemu-system-x86_64.exe" (
    echo Error: qemu-system-x86_64.exe is not installed.
    exit /b
) else (
    echo QEMU is already installed.
)
set PATH=%PATH%;"C:\Program Files\qemu"

:: Get NodeJS dependencies
call npm install

:: Get the CYGWIN dependencies for our runtime folder.
if not exist "build" (
    mkdir build
)
cd build

if not exist "bin" (
    powershell -Command "& Invoke-WebRequest -OutFile .\setup.exe https://cygwin.com/setup-x86_64.exe"
    .\setup.exe -q -n -N -d -B -R .\ -s https://mirrors.sonic.net/cygwin -l %cd% -P wget
)
set PATH=%cd%\bin;%PATH%;
if not exist "bin\apt-cyg" (

    :: Install OpenSSH
    echo "Installing OpenSSH..."
    wget https://rawgit.com/transcode-open/apt-cyg/master/apt-cyg -P ./
    install ./apt-cyg /bin
    bash apt-cyg install openssh zip unzip coreutils
)

:: Remove the runtime\win_x64 folder if it exists
if exist "..\runtime\win_x64" (
    rd /s /q "..\runtime\win_x64"
)

:: copy dependencies to runtime folder for Windows
mkdir "..\runtime\win_x64\bin\share"
copy /Y bin\touchr.exe "..\runtime\win_x64\bin\touch.exe"
copy /Y bin\tar.exe "..\runtime\win_x64\bin\tar.exe"
copy /Y bin\xz.exe "..\runtime\win_x64\bin\xz.exe"
copy /Y bin\ssh.exe "..\runtime\win_x64\bin\ssh.exe"
copy /Y bin\zip.exe "..\runtime\win_x64\bin\zip.exe"
copy /Y bin\unzip.exe "..\runtime\win_x64\bin\unzip.exe"
copy /Y bin\split.exe "..\runtime\win_x64\bin\split.exe"
copy /Y bin\cat.exe "..\runtime\win_x64\bin\cat.exe"
copy /Y bin\cygwin1.dll "..\runtime\win_x64\bin\cygwin1.dll"
copy /Y bin\cygiconv-2.dll "..\runtime\win_x64\bin\cygiconv-2.dll"
copy /Y bin\cygintl-8.dll "..\runtime\win_x64\bin\cygintl-8.dll"
copy /Y bin\cyglzma-5.dll "..\runtime\win_x64\bin\cyglzma-5.dll"
copy /Y bin\cygcrypto-1.1.dll "..\runtime\win_x64\bin\cygcrypto-1.1.dll"
copy /Y bin\cygcrypto-3.dll "..\runtime\win_x64\bin\cygcrypto-3.dll"
copy /Y bin\cygz.dll "..\runtime\win_x64\bin\cygz.dll"
copy /Y bin\cyggssapi_krb5-2.dll "..\runtime\win_x64\bin\cyggssapi_krb5-2.dll"
copy /Y bin\cygk5crypto-3.dll "..\runtime\win_x64\bin\cygk5crypto-3.dll"
copy /Y bin\cygkrb5-3.dll "..\runtime\win_x64\bin\cygkrb5-3.dll"
copy /Y bin\cygkrb5support-0.dll "..\runtime\win_x64\bin\cygkrb5support-0.dll"
copy /Y bin\cygcom_err-2.dll "..\runtime\win_x64\bin\cygcom_err-2.dll"
copy /Y bin\cyggcc_s-seh-1.dll "..\runtime\win_x64\bin\cyggcc_s-seh-1.dll"

:: Obtain dependency walker from https://www.dependencywalker.com/depends22_x64.zip
if not exist "depends.exe" (
    echo Downloading Dependency Walker...
    curl -LO https://www.dependencywalker.com/depends22_x64.zip
    powershell -Command "Expand-Archive -Path .\depends22_x64.zip -DestinationPath ."
)
depends.exe /c /f:1 /oc:depends.csv "C:\Program Files\qemu\qemu-system-x86_64.exe"
:loop
if not exist depends.csv (
    timeout /t 1
    goto loop
)

:: Get all lines in depends.csv with \qemu\ in them 
@echo off
(
echo Set objFSO = CreateObject^("Scripting.FileSystemObject"^)
echo Set objFile = objFSO.OpenTextFile^("depends.csv", 1^)
echo Set objCommandFile = objFSO.CreateTextFile^("copyfiles.bat", True^)
echo Do Until objFile.AtEndOfStream
echo.    strLine = objFile.ReadLine
echo.    If InStr^(strLine, "\qemu\"^) ^> 0 Then
echo.        firstQuotePos = InStr^(strLine, Chr^(34^)^)
echo.        if firstQuotePos ^> 0 Then
echo.            strLineFromFirstQuote = Mid^(strLine, firstQuotePos^)
echo.            secondQuotePos = InStr^(2, strLineFromFirstQuote, Chr^(34^)^)
echo.            if secondQuotePos ^> 0 Then
echo.                quotedString = Left^(strLineFromFirstQuote, secondQuotePos^)
echo.                command = "copy /Y " + quotedString + " ..\runtime\win_x64\bin\"
echo.                objCommandFile.WriteLine command
echo.            End If
echo.        End If
echo.    End If
echo Loop
echo objFile.Close
) > temp.vbs

cscript //nologo temp.vbs
REM del temp.vbs
call copyfiles.bat

:: --- Download Node.js executable ---
set NODE_VERSION=v20.9.0
set NODE_ARCH=x64
set NODE_EXE_URL=https://nodejs.org/dist/%NODE_VERSION%/win-%NODE_ARCH%/node.exe
set NODE_RUNTIME_BIN_DIR=..\runtime\win_x64\bin
set NODE_TARGET_EXE_PATH=%NODE_RUNTIME_BIN_DIR%\node.exe

echo Checking for existing Node.js executable: %NODE_TARGET_EXE_PATH%
if exist "%NODE_TARGET_EXE_PATH%" (
    echo Node.js %NODE_VERSION% for Windows %NODE_ARCH% already exists at %NODE_TARGET_EXE_PATH%.
) else (
    echo Node.js %NODE_VERSION% for Windows %NODE_ARCH% not found at %NODE_TARGET_EXE_PATH%. Downloading...
    echo Downloading from %NODE_EXE_URL% to %NODE_TARGET_EXE_PATH%
    
    REM Ensure the target directory exists
    if not exist "%NODE_RUNTIME_BIN_DIR%" (
        echo Creating directory: %NODE_RUNTIME_BIN_DIR%
        mkdir "%NODE_RUNTIME_BIN_DIR%"
    )

    REM Use System.Net.WebClient for broader PowerShell compatibility
    powershell -Command "$ProgressPreference = 'SilentlyContinue'; try { $webClient = New-Object System.Net.WebClient; $webClient.DownloadFile('%NODE_EXE_URL%', '%NODE_TARGET_EXE_PATH%'); Write-Host 'Node.js executable downloaded successfully.' } catch { Write-Error ('Exception during Node.js download: ' + $_.Exception.Message); if (Test-Path '%NODE_TARGET_EXE_PATH%') { Remove-Item '%NODE_TARGET_EXE_PATH%' }; exit 1 }"
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to download Node.js executable.
        exit /b 1
    )
    echo Node.js executable downloaded successfully to %NODE_TARGET_EXE_PATH%.
)
:: --- End Node.js executable Download ---

:: Cleanup
cd ..

copy /Y "C:\Program Files\qemu\share\kvmvapic.bin" ".\runtime\win_x64\bin\share\kvmvapic.bin"
copy /Y "C:\Program Files\qemu\share\vgabios-virtio.bin" ".\runtime\win_x64\bin\share\vgabios-virtio.bin"
copy /Y "C:\Program Files\qemu\share\efi-e1000e.rom" ".\runtime\win_x64\bin\share\efi-e1000e.rom"
copy /Y "C:\Program Files\qemu\qemu-img.exe" ".\runtime\win_x64\bin\qemu-img.exe"

if not exist ".\build\launcher\Devstia.exe" (
    cd launcher
    call make_exe.bat
    cd ..\
)

:: Cleanup old build/dist folder
if exist "build\dist\win_x64" (
    rd /s /q "build\dist\win_x64"
)
mkdir build\dist\win_x64\runtime

:: Copy over Devstia.exe 
copy /Y build\launcher\Devstia.exe build\dist\win_x64\Devstia.exe
copy /Y launcher\Devstia.bat build\dist\win_x64\Devstia.bat
copy /Y package.json build\dist\win_x64\package.json
copy /Y package-lock.json build\dist\win_x64\package-lock.json
copy /Y LICENSE build\dist\win_x64\LICENSE
copy /Y README.md build\dist\win_x64\README.md

:: Copy the entire runtime\win_x64 directory structure to build\dist\win_x64\runtime
xcopy /E /I /Y runtime build\dist\win_x64\runtime
xcopy /E /I /Y node_modules build\dist\win_x64\node_modules
xcopy /E /I /Y images build\dist\win_x64\images
xcopy /E /I /Y document_errors build\dist\win_x64\document_errors
xcopy /E /I /Y src build\dist\win_x64\src
xcopy /E /I /Y scripts build\dist\win_x64\scripts

echo Build process complete
