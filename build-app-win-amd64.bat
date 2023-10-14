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
