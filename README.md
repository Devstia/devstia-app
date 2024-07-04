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

#### 2) Next, install the NodeJS dependencies and build the application using the following npm commands OR use the automated build script (see the *Signing* section below).

```
npm install
nipm run package
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

### For Macintosh
On Apple Macintosh, use the automated build script `build-app-mac-amd64.sh` to build the Macintosh x86-64-bit compatible application or `build-app-mac-arm64.sh` to build the Apple Silicon M1, M2, or M3 compatible application; and digitally sign the application binary. The following prerequisites are needed:

* A Macintosh system matching the platform architecture of the binary being build; an Intel-based Macintosh or Apple Silicon M1, M2 or M3 based Macintosh.
* The application is digitally code signed using the XCode SDK, ensure the SDK is installed and that the codesign command is apart of the command line path.
* You must have a valid Apple Developer License with associated Apple Username/email, Apple Developer ID, and Apple Developer application password. 
* You must set the environment variables for APPLE_USER, APPLE_PW, and APPLE_DEV_ID, For example:
```
APPLE_USER=steve@steveorevo.com
APPLE_PW=0123-4567-89AB-CDEF
APPLE_DEV_ID=ABCDE12345
```

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
