:: 
:: Get the CYGWIN dependencies for our runtime folder.
:: 
@echo off
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

:: Make temp folder if it does not exist
if not exist "temp" (
    mkdir temp
)
cd temp
powershell -Command "& Invoke-WebRequest -OutFile .\setup.exe https://cygwin.com/setup-x86_64.exe"
.\setup.exe -q -n -N -d -B -R .\ -s https://mirrors.sonic.net/cygwin -l %cd% -P wget
set PATH=%cd%\bin;%PATH%;
wget https://rawgit.com/transcode-open/apt-cyg/master/apt-cyg -P ./
install ./apt-cyg /bin

:: Install OpenSSH
bash apt-cyg install openssh

:: Remove the runtime\win32_x64 folder if it exists
if exist "..\runtime\win32_x64" (
    rd /s /q "..\runtime\win32_x64"
)

:: copy dependencies to runtime folder for Windows
mkdir "..\runtime\win32_x64\bin\share"
copy /Y bin\tar.exe "..\runtime\win32_x64\bin\tar.exe"
copy /Y bin\xz.exe "..\runtime\win32_x64\bin\xz.exe"
copy /Y bin\ssh.exe "..\runtime\win32_x64\bin\ssh.exe"
copy /Y bin\cygwin1.dll "..\runtime\win32_x64\bin\cygwin1.dll"
copy /Y bin\cygiconv-2.dll "..\runtime\win32_x64\bin\cygiconv-2.dll"
copy /Y bin\cygintl-8.dll "..\runtime\win32_x64\bin\cygintl-8.dll"
copy /Y bin\cyglzma-5.dll "..\runtime\win32_x64\bin\cyglzma-5.dll"
copy /Y bin\cygcrypto-1.1.dll "..\runtime\win32_x64\bin\cygcrypto-1.1.dll"
copy /Y bin\cygcrypto-3.dll "..\runtime\win32_x64\bin\cygcrypto-3.dll"
copy /Y bin\cygz.dll "..\runtime\win32_x64\bin\cygz.dll"
copy /Y bin\cyggssapi_krb5-2.dll "..\runtime\win32_x64\bin\cyggssapi_krb5-2.dll"
copy /Y bin\cygk5crypto-3.dll "..\runtime\win32_x64\bin\cygk5crypto-3.dll"
copy /Y bin\cygkrb5-3.dll "..\runtime\win32_x64\bin\cygkrb5-3.dll"
copy /Y bin\cygkrb5support-0.dll "..\runtime\win32_x64\bin\cygkrb5support-0.dll"
copy /Y bin\cygcom_err-2.dll "..\runtime\win32_x64\bin\cygcom_err-2.dll"
copy /Y bin\cyggcc_s-seh-1.dll "..\runtime\win32_x64\bin\cyggcc_s-seh-1.dll"

:: Obtain dependency walker from https://www.dependencywalker.com/depends22_x64.zip
curl -LO https://www.dependencywalker.com/depends22_x64.zip
powershell -Command "Expand-Archive -Path .\depends22_x64.zip -DestinationPath ."
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
echo.                command = "copy /Y " + quotedString + " ..\runtime\win32_x64\bin\"
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

:: Cleanup
cd ..
rmdir /s /q temp

copy /Y "C:\Program Files\qemu\share\kvmvapic.bin" ".\runtime\win32_x64\bin\share\kvmvapic.bin"
copy /Y "C:\Program Files\qemu\share\vgabios-virtio.bin" ".\runtime\win32_x64\bin\share\vgabios-virtio.bin"
copy /Y "C:\Program Files\qemu\share\efi-e1000e.rom" ".\runtime\win32_x64\bin\share\efi-e1000e.rom"

:: Package the application
call npm run package
:: Sign the application binaries

:: Check if signtool is in the PATH
@echo off
signtool /? >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo signtool not found or not accessible. Exiting script...
    exit /b
) else (
    echo signtool found and accessible.
)

:: Check if WIN_CERT_SUBJECT_NAME is set
if "%WIN_CERT_SUBJECT_NAME%"=="" (
    echo WIN_CERT_SUBJECT_NAME is not set. Exiting script...
    exit /b
) else (
    echo WIN_CERT_SUBJECT_NAME is set to %WIN_CERT_SUBJECT_NAME%.
)

:: Sign the application binaries
signtool sign /n "%WIN_CERT_SUBJECT_NAME%" /t http://time.certum.pl/ /fd sha256 /v ".\out\Devstia-win32-x64\Devstia.exe" ".\out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\qemu-system-x86_64.exe" ".\out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\ssh.exe" ".\out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\tar.exe" ".\out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\xz.exe"

:: Check that the Inno Setup ISCC tool is in the PATH
@echo off
setlocal enabledelayedexpansion
iscc /? >temp.txt 2>&1
findstr /C:"not found" temp.txt >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo Inno Setup ISCC not found or not accessible. Exiting script...
    del temp.txt
    exit /b
) else (
    echo Inno Setup ISCC found and accessible.
)
del temp.txt
endlocal

:: Build the setup installer
iscc installer.iss

:: Sign the installer
signtool sign /n "%WIN_CERT_SUBJECT_NAME%" /t http://time.certum.pl/ /fd sha256 /v ".\out\inno-setup\Devstia Preview Setup.exe"

