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
copy bin\cygwin1.dll ..\runtime\win32_x64\cygwin1.dll
copy bin\cygiconv-2.dll ..\runtime\win32_x64\cygiconv-2.dll
copy bin\cygintl-8.dll ..\runtime\win32_x64\cygintl-8.dll
copy bin\cyglzma-5.dll ..\runtime\win32_x64\cyglzma-5.dll
copy bin\cygcrypto-1.1.dll ..\runtime\win32_x64\cygcrypto-1.1.dll
copy bin\cygz.dll ..\runtime\win32_x64\cygz.dll
copy bin\cyggssapi_krb5-2.dll ..\runtime\win32_x64\cyggssapi_krb5-2.dll
copy bin\cygk5crypto-3.dll ..\runtime\win32_x64\cygk5crypto-3.dll
copy bin\cygkrb5-3.dll ..\runtime\win32_x64\cygkrb5-3.dll
copy bin\cygkrb5support-0.dll ..\runtime\win32_x64\cygkrb5support-0.dll
copy bin\cygcom_err-2.dll ..\runtime\win32_x64\cygcom_err-2.dll
copy bin\cyggcc_s-seh-1.dll ..\runtime\win32_x64\cyggcc_s-seh-1.dll

:: Cleanup
cd ..
rmdir /s /q temp

:: assume default qemu is installed (i.e. via cg-pws-vm/build-vm-win-amd64.bat)
copy "C:\Program Files\qemu\qemu-system-x86_64.exe" ..\runtime\win32_x64\qemu-system-x86_64.exe
copy "C:\Program Files\qemu\sdl2.dll" ..\runtime\win32_x64\sdl2.dll
copy "C:\Program Files\qemu\sdl2_image.dll" ..\runtime\win32_x64\sdl2_image.dll
copy "C:\Program Files\qemu\libjpeg-8.dll" ..\runtime\win32_x64\libjpeg-8.dll
copy "C:\Program Files\qemu\libjxl.dll" ..\runtime\win32_x64\libjxl.dll
copy "C:\Program Files\qemu\libgcc_s_seh-1.dll" ..\runtime\win32_x64\libgcc_s_seh-1.dll
copy "C:\Program Files\qemu\libstdc++-6.dll" ..\runtime\win32_x64\libstdc++-6.dll
copy "C:\Program Files\qemu\libwinpthread-1.dll" ..\runtime\win32_x64\libwinpthread-1.dll
copy "C:\Program Files\qemu\libbrotlidec.dll" ..\runtime\win32_x64\libbrotlidec.dll
copy "C:\Program Files\qemu\libbrotlicommon.dll" ..\runtime\win32_x64\libbrotlicommon.dll
copy "C:\Program Files\qemu\libbrotlienc.dll" ..\runtime\win32_x64\libbrotlienc.dll
copy "C:\Program Files\qemu\libhwy.dll" ..\runtime\win32_x64\libhwy.dll
copy "C:\Program Files\qemu\liblcms2-2.dll" ..\runtime\win32_x64\liblcms2-2.dll
copy "C:\Program Files\qemu\libpng16-16.dll" ..\runtime\win32_x64\libpng16-16.dll
copy "C:\Program Files\qemu\libtiff-6.dll" ..\runtime\win32_x64\libtiff-6.dll
copy "C:\Program Files\qemu\libdeflate.dll" ..\runtime\win32_x64\libdeflate.dll
copy "C:\Program Files\qemu\libjbig-0.dll" ..\runtime\win32_x64\libjbig-0.dll
copy "C:\Program Files\qemu\liblerc.dll" ..\runtime\win32_x64\liblerc.dll
copy "C:\Program Files\qemu\liblzma-5.dll" ..\runtime\win32_x64\liblzma-5.dll
copy "C:\Program Files\qemu\libwebp-7.dll" ..\runtime\win32_x64\libwebp-7.dll
copy "C:\Program Files\qemu\zlib1.dll" ..\runtime\win32_x64\zlib1.dll
copy "C:\Program Files\qemu\libzstd.dll" ..\runtime\win32_x64\libzstd.dll
copy "C:\Program Files\qemu\libsharpyuv-0.dll" ..\runtime\win32_x64\libsharpyuv-0.dll
copy "C:\Program Files\qemu\brlapi-0.8.dll" ..\runtime\win32_x64\brlapi-0.8.dll
copy "C:\Program Files\qemu\libbz2-1.dll" ..\runtime\win32_x64\libbz2-1.dll
copy "C:\Program Files\qemu\libcacard-0.dll" ..\runtime\win32_x64\libcacard-0.dll
copy "C:\Program Files\qemu\libglib-2.0-0.dll" ..\runtime\win32_x64\libglib-2.0-0.dll
copy "C:\Program Files\qemu\libintl-8.dll" ..\runtime\win32_x64\libintl-8.dll
copy "C:\Program Files\qemu\libnspr4.dll" ..\runtime\win32_x64\libnspr4.dll
copy "C:\Program Files\qemu\nss3.dll" ..\runtime\win32_x64\nss3.dll
copy "C:\Program Files\qemu\nssutil3.dll" ..\runtime\win32_x64\nssutil3.dll
copy "C:\Program Files\qemu\libplc4.dll" ..\runtime\win32_x64\libplc4.dll
copy "C:\Program Files\qemu\libplds4.dll" ..\runtime\win32_x64\libplds4.dll
copy "C:\Program Files\qemu\libcairo-2.dll" ..\runtime\win32_x64\libcairo-2.dll
copy "C:\Program Files\qemu\libfontconfig-1.dll" ..\runtime\win32_x64\libfontconfig-1.dll
copy "C:\Program Files\qemu\libexpat-1.dll" ..\runtime\win32_x64\libexpat-1.dll
copy "C:\Program Files\qemu\libfreetype-6.dll" ..\runtime\win32_x64\libfreetype-6.dll
copy "C:\Program Files\qemu\libiconv-2.dll" ..\runtime\win32_x64\libiconv-2.dll
copy "C:\Program Files\qemu\libharfbuzz-0.dll" ..\runtime\win32_x64\libharfbuzz-0.dll
copy "C:\Program Files\qemu\libgraphite2.dll" ..\runtime\win32_x64\libgraphite2.dll
copy "C:\Program Files\qemu\libpixman-1-0.dll" ..\runtime\win32_x64\libpixman-1-0.dll
copy "C:\Program Files\qemu\libcapstone.dll" ..\runtime\win32_x64\libcapstone.dll
copy "C:\Program Files\qemu\libcurl-4.dll" ..\runtime\win32_x64\libcurl-4.dll
copy "C:\Program Files\qemu\libidn2-0.dll" ..\runtime\win32_x64\libidn2-0.dll
copy "C:\Program Files\qemu\libunistring-5.dll" ..\runtime\win32_x64\libunistring-5.dll
copy "C:\Program Files\qemu\libpsl-5.dll" ..\runtime\win32_x64\libpsl-5.dll
copy "C:\Program Files\qemu\libssh2-1.dll" ..\runtime\win32_x64\libssh2-1.dll
copy "C:\Program Files\qemu\libepoxy-0.dll" ..\runtime\win32_x64\libepoxy-0.dll
copy "C:\Program Files\qemu\libfdt-1.dll" ..\runtime\win32_x64\libfdt-1.dll
copy "C:\Program Files\qemu\libgdk-3-0.dll" ..\runtime\win32_x64\libgdk-3-0.dll
copy "C:\Program Files\qemu\libcairo-gobject-2.dll" ..\runtime\win32_x64\libcairo-gobject-2.dll
copy "C:\Program Files\qemu\libgobject-2.0-0.dll" ..\runtime\win32_x64\libgobject-2.0-0.dll
copy "C:\Program Files\qemu\libfribidi-0.dll" ..\runtime\win32_x64\libfribidi-0.dll
copy "C:\Program Files\qemu\libgdk_pixbuf-2.0-0.dll" ..\runtime\win32_x64\libgdk_pixbuf-2.0-0.dll
copy "C:\Program Files\qemu\libgio-2.0-0.dll" ..\runtime\win32_x64\libgio-2.0-0.dll
copy "C:\Program Files\qemu\libpangowin32-1.0-0.dll" ..\runtime\win32_x64\libpangowin32-1.0-0.dll
copy "C:\Program Files\qemu\libthai-0.dll" ..\runtime\win32_x64\libthai-0.dll
copy "C:\Program Files\qemu\libdatrie-1.dll" ..\runtime\win32_x64\libdatrie-1.dll
copy "C:\Program Files\qemu\libpangocairo-1.0-0.dll" ..\runtime\win32_x64\libpangocairo-1.0-0.dll
copy "C:\Program Files\qemu\libpango-1.0-0.dll" ..\runtime\win32_x64\libpango-1.0-0.dll
copy "C:\Program Files\qemu\libpangoft2-1.0-0.dll" ..\runtime\win32_x64\libpangoft2-1.0-0.dll
copy "C:\Program Files\qemu\libgnutls-30.dll" ..\runtime\win32_x64\libgnutls-30.dll
copy "C:\Program Files\qemu\libgmp-10.dll" ..\runtime\win32_x64\libgmp-10.dll
copy "C:\Program Files\qemu\libhogweed-6.dll" ..\runtime\win32_x64\libhogweed-6.dll
copy "C:\Program Files\qemu\libnettle-8.dll" ..\runtime\win32_x64\libnettle-8.dll
copy "C:\Program Files\qemu\libp11-kit-0.dll" ..\runtime\win32_x64\libp11-kit-0.dll
copy "C:\Program Files\qemu\libffi-8.dll" ..\runtime\win32_x64\libffi-8.dll
copy "C:\Program Files\qemu\libtasn1-6.dll" ..\runtime\win32_x64\libtasn1-6.dll
copy "C:\Program Files\qemu\libgtk-3-0.dll" ..\runtime\win32_x64\libgtk-3-0.dll
copy "C:\Program Files\qemu\libatk-1.0-0.dll" ..\runtime\win32_x64\libatk-1.0-0.dll
copy "C:\Program Files\qemu\libgmodule-2.0-0.dll" ..\runtime\win32_x64\libgmodule-2.0-0.dll
copy "C:\Program Files\qemu\libjack64.dll" ..\runtime\win32_x64\libjack64.dll
copy "C:\Program Files\qemu\libdb-6.0.dll" ..\runtime\win32_x64\libdb-6.0.dll
copy "C:\Program Files\qemu\libsystre-0.dll" ..\runtime\win32_x64\libsystre-0.dll
copy "C:\Program Files\qemu\libtre-5.dll" ..\runtime\win32_x64\libtre-5.dll
copy "C:\Program Files\qemu\liblzo2-2.dll" ..\runtime\win32_x64\liblzo2-2.dll
copy "C:\Program Files\qemu\libncursesw6.dll" ..\runtime\win32_x64\libncursesw6.dll
copy "C:\Program Files\qemu\libnfs-14.dll" ..\runtime\win32_x64\libnfs-14.dll
copy "C:\Program Files\qemu\libsasl2-3.dll" ..\runtime\win32_x64\libsasl2-3.dll
copy "C:\Program Files\qemu\libslirp-0.dll" ..\runtime\win32_x64\libslirp-0.dll
copy "C:\Program Files\qemu\libsnappy.dll" ..\runtime\win32_x64\libsnappy.dll
copy "C:\Program Files\qemu\libspice-server-1.dll" ..\runtime\win32_x64\libspice-server-1.dll
copy "C:\Program Files\qemu\libcrypto-3-x64.dll" ..\runtime\win32_x64\libcrypto-3-x64.dll
copy "C:\Program Files\qemu\libgstapp-1.0-0.dll" ..\runtime\win32_x64\libgstapp-1.0-0.dll
copy "C:\Program Files\qemu\libgstbase-1.0-0.dll" ..\runtime\win32_x64\libgstbase-1.0-0.dll
copy "C:\Program Files\qemu\libgstreamer-1.0-0.dll" ..\runtime\win32_x64\libgstreamer-1.0-0.dll
copy "C:\Program Files\qemu\libopus-0.dll" ..\runtime\win32_x64\libopus-0.dll
copy "C:\Program Files\qemu\liborc-0.4-0.dll" ..\runtime\win32_x64\liborc-0.4-0.dll
copy "C:\Program Files\qemu\libssl-3-x64.dll" ..\runtime\win32_x64\libssl-3-x64.dll
copy "C:\Program Files\qemu\libssh.dll" ..\runtime\win32_x64\libssh.dll
copy "C:\Program Files\qemu\libusb-1.0.dll" ..\runtime\win32_x64\libusb-1.0.dll
copy "C:\Program Files\qemu\libusbredirparser-1.dll" ..\runtime\win32_x64\libusbredirparser-1.dll
copy "C:\Program Files\qemu\libvirglrenderer-1.dll" ..\runtime\win32_x64\libvirglrenderer-1.dll
copy "C:\Program Files\qemu\libssp-0.dll" ..\runtime\win32_x64\libssp-0.dll
