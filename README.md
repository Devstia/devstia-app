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

#### 2) Next, install the NodeJS dependencies and build the application:
```
npm install
npm run make
```

The resulting executable can be found for your architecture and platform in the resulting `out` folder. 

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
