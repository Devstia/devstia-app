:: 
:: Build the CYGWIN dependencies for our runtime folder.
:: 

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

:: Copy dependencies to runtime folder for win32_x64
copy bin\tar.exe ..\runtime\win32_x64\tar.exe
copy bin\xz.exe ..\runtime\win32_x64\xz.exe
copy bin\ssh.exe ..\runtime\win32_x64\ssh.exe
copy bin\scp.exe ..\runtime\win32_x64\scp.exe
copy bin\bash.exe ..\runtime\win32_x64\bash.exe
copy bin\cyglzma-5.dll ..\runtime\win32_x64\cyglzma-5.dll
copy bin\cygwin1.dll ..\runtime\win32_x64\cygwin1.dll
copy bin\cygiconv-2.dll ..\runtime\win32_x64\cygiconv-2.dll
copy bin\cygintl-8.dll ..\runtime\win32_x64\cygintl-8.dll
copy bin\cygcrypto-1.1.dll ..\runtime\win32_x64\cygcrypto-1.1.dll
copy bin\cyggssapi_krb5-2.dll ..\runtime\win32_x64\cyggssapi_krb5-2.dll
copy bin\cygz.dll ..\runtime\win32_x64\cygz.dll
copy bin\cyggcc_s-seh-1.dll ..\runtime\win32_x64\cyggcc_s-seh-1.dll
copy bin\cygk5crypto-3.dll ..\runtime\win32_x64\cygk5crypto-3.dll
copy bin\cygkrb5-3.dll ..\runtime\win32_x64\cygkrb5-3.dll
copy bin\cygkrb5support-0.dll ..\runtime\win32_x64\cygkrb5support-0.dll
copy bin\cygcom_err-2.dll ..\runtime\win32_x64\cygcom_err-2.dll
copy bin\cygreadline7.dll ..\runtime\win32_x64\cygreadline7.dll
copy bin\cygncursesw-10.dll ..\runtime\win32_x64\cygncursesw-10.dll

:: Cleanup
cd ..
rmdir /s /q temp
