# devstia-app
Virtuosoft's [Devstia Preview](https://devstia.com/preview) is a fully featured, localhost development web server that includes multiple database engines, computer languages, and server protocols; just like a real hosting provider. Devstia is more than just a "LAMP" and "LEMP" stack; it's a cumulation of cutting edge, open technologies, with an enhanced open source [Hestia Control Panel](https://hestiacp.com). All of this functionality is wrapped up into an easy-to-use, native, desktop application.

These features help facilitate running and developing diverse web based applications. It is offered as an "optimized" server, specific for the user's OS platform (Linux, Windows, or macOS) and is built specifically for modern hardware architectures (ARM64/Apple Silicon and AMD64/Intel x86, 64-bit processors). The application can optionally connect to [https://devstia.com](https://devstia.com) to obtain community updates and optional premium features.

:star: **For pre-built binaries and support** :star:, visit [https://devstia.com](https://devstia.com).

> :warning: !!! Note: this repo is in progress; when completed, a release will appear in the release tab.

&nbsp;

-----

&nbsp;

## Building
Building the Devstia Preview application is a separate process from the architecture specific Debian based runtime (those instructions can be found in the [devstia-vm](https://github.com/virtuosoft-dev/devstia-vm)). This repo is specific for the native desktop application and system menu/tray application used to manage the devstia-vm runtime.

This repo is to provide source code and technology transparancy, and assists in the complex task of building Devstia Preview from scratch.

&nbsp;

> :triangular_flag_on_post: Devstia Preview is distributed under GNU **Affero** General Public License v3.0. *Any modified version, including use as a service over a network, requires that the complete source code of the modified version must be made available*.

&nbsp;


#### 1) Start by cloning this repo [via git](https://git-scm.com) to a local folder, followed by changing directories to that folder:
```
git clone https://github.com/virtuosoft-dev/devstia-app devstia-app
cd devstia-app
```

#### 2) Next, install the NodeJS dependencies and build the application using the associated build script for your platform; I.e. for Windows on x86 64-bit compatible processors, run:
```
.\build-app-win-amd64.bat
```

For macOS on x86 64-bit compatible processors, run:
```
./build-app-mac-amd64.sh
```

For macOS on Apple Silicon (M1, M2, and M3 processors), run:
```
./build-app-mac-arm64.sh
```

The resulting executable can be found for your architecture and platform in the resulting `out` folder. 

&nbsp;

-----

&nbsp;

## Signing
Digitally signing the Devstia Preview application incurs private distribution costs and is not a part of this open source project's endeavors. Packaging and signing is solely up to the application distributor. Officially signed application binaries can be found at https://devstia.com. However, these notes can assist users that wish to sign their own application and is furnished as a complimentary reference guide by the application founder:

### For Windows
On Windows, use the automated build script `build-app-win-amd64.bat` to build the Windows x86-64-bit compatible application, the setup installer, and digitally sign the application and setup binaries. The following prerequisites are needed:

* A Windows system matching the platform architecture of the binary being built; currently only x86-64bit compatible systems are supported on Windows.
* The application is digitally code signed using the Windows SDK, ensure the SDK is installed and that the signtool is apart of the command line path i.e. `set PATH=%PATH%;"C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64"`.
* The application is distributed with an automated installer; Inno Setup. The free Inno Setup project at https://jrsoftware.org/isinfo is used to create the installer via the included project file `installer.iss`. Ensure the Inno Setup command line tool is apart of the command line path i.e. `set PATH=%PATH%;"C:\Program Files (x86)\Inno Setup 6"`.
* You must set the environment variable `WIN_CERT_SUBJECT_NAME` with a valid subject name of the Windows compatible signer's certificate. This is used to locate the certificate in the Windows Certificate Store used to sign the files i.e. `set "WIN_CERT_SUBJECT_NAME=Open Source Developer, Stephen Carnam"`.

out\Devstia-win32-x64\Devstia.exe
out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\qemu-system-x86_64.exe
out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\ssh.exe
out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\tar.exe
out\Devstia-win32-x64\resources\app\runtime\win32_x64\bin\xz.exe


With the Windows SDK, one should have the signtool.exe for their platform/architecture installed; running the following commands will appropriately sign the executables. For the currently supported x64 architecture, the signtool.exe from the Windows SDK (i.e. “C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64”) should be in the command line tool’s path (i.e. via set PATH=%PATH%;"C:\Program Files (x86)\Windows Kits\10\bin\10.0.19041.0\x64"). With a valid path, a developer can sign their executable; for example this project author could sign Devstia Preview for Windows x64 architecture when equipped with the following valid certificate and hardware required to do physical signing:


signtool sign /n "Open Source Developer, Stephen Carnam" /t http://time.certum.pl/ /fd sha256 /v "Devstia.exe" ".\resources\app\runtime\win32_x64\bin\qemu-system-x86_64.exe" ".\resources\app\runtime\win32_x64\bin\ssh.exe" ".\resources\app\runtime\win32_x64\bin\tar.exe" ".\resources\app\runtime\win32_x64\bin\xz.exe"


With the out/Devstia-win32-x64 application binaries properly signed; the Inno Setup script can be executed to produce the setup package at: “out\inno-setup\Devstia Preview Setup.exe”


This final setup/installer program should also be digitally signed from the “out\inno-setup” folder via:
signtool sign /n "Open Source Developer, Stephen Carnam" /t http://time.certum.pl/ /fd sha256 /v "Devstia Preview Setup.exe" 

### For Macintosh
On Apple Macintosh, the application bundle is signed using Apple's XCode developmemnt tools. This requires a valid Apple Developer License and the XCode SDK installed. For reference, the following 

&nbsp;

-----

&nbsp;

## FAQ

***Do I need an Internet connection to run Devstia Preview?***
* No. In offline mode, you still have access to the HestiaCP-based control panel to manage all aspects of the server. Devstia Preview is perfectly capable of running offline, disconnected from any network/Internet connection; however you will not be able to receive updates or use advanced features offered through Devstia's online portal [devstia.com](https://devstia.com). 

***Why run/develop my nodejs/php/python3/go application using Devstia vs my own web server?***
* Web servers vary in the ways they can be configured, deploy, distribute, and/or manage application runtimes and dependencies. Virtuosoft Devstia specifically addresses this issue by providing the runtimes needed for today's most popular web applications and runtime environments as plugins to a free, open source, and light-weight control panel to orchanstrate it all; [HestiaCP](https://hestiacp.com). With Devstia at the helm, you can get the exact same hosting server on your desktop as you have in the cloud. This makes development, staging, and live, in-production websites consistent and predictable.   

## Support the creator
You can help this author's open source development endeavors by donating any amount to Stephen J. Carnam @ Virtuosoft. Your donation, no matter how large or small helps pay for essential time and resources to create MIT and GPL licensed projects that you and the world can benefit from. Click the link below to donate today :)
<div>
         

[<kbd> <br> Donate to this Project <br> </kbd>][KBD]


</div>


<!---------------------------------------------------------------------------->

[KBD]: https://virtuosoft.com/donate

https://virtuosoft.com/donate
