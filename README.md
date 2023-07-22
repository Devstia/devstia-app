# cg-pws-app
Virtuosoft's [CodeGarden](https://code.gdn) PWS (personal web server) is a desktop application for running and developing web applications on a desktop computer with CODE (Core Open Developer Elements aka 'CodeGarden'). CodeGarden is more than just another LAMP or LEMP stack; it's a cumulation of open source software with an enhanced open source [Hestia Control Panel](https://hestiacp.com). CodeGarden PWS Edition wraps all of this functionality into an easy-to-use, native, desktop application.

These features help facilitate running and developing diverse web based applications. It is offered as an "optimized" server, specific for the user's OS platform (Linux, Windows, or macOS); in addition to specific hardware architectures (ARM64/Apple Silicon and AMD64/Intel x86, 64-bit processors). The application can optionally connect online to [CodeGarden](https://code.gdn) for additional automation features geared for cutting-edge developers and solution providers.

:star: **For pre-built binaries and support** :star:, visit [https://code.gdn](https://code.gdn).

> :warning: !!! Note: this repo is in progress; when completed, a release will appear in the release tab.

&nbsp;

-----

&nbsp;

## Building
Building CodeGarden PWS application is a separate process from the architecture specific Debian based runtime (those instructions can be found in the [cg-pws-vm repo](https://github.com/virtuosoft-dev/cg-pws-vm). This repo is specific for the native desktop application and system menu/tray used to manage the CODE runtime.

This repo is to provide source code and technology transparancy, and assists in the complex task of building CodeGarden PWS.

&nbsp;

> :triangular_flag_on_post: CodeGarden PWS Edition is distributed under GNU **Affero** General Public License v3.0. *Any modified version, including use as a service over a network, requires that the complete source code of the modified version must be made available*.

&nbsp;


#### 1) Start by cloning this repo [via git](https://git-scm.com) to a local folder, followed by changing directories to that folder:
```
git clone https://github.com/virtuosoft-dev/cg-pws-app cg-pws-app
cd cg-pws-app
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

***Do I need an Internet connection to run CodeGarden PWS?***
* No. In offline mode, you still have access to the HestiaCP-based control panel to manage all aspects of the server. CodeGarden PWS edition is perfectly capable of running offline, disconnected from any network/Internet connection; however you will not be able to receive updates or use the simplified, solutions library, and advanced features offered through CodeGarden's online portal [code.gdn](https://code.gdn). 

***Why run/develop my nodejs/php/python3/go application using CODE vs my own container?***
* Containers are a great way to run, deploy, distribute, and/or manage applications but there is still the question of what the containers themselves should contain. CodeGarden specifically addresses this issue by providing the runtimes needed for today's most popular web applications with a light-weight control panel to furnish options. In fact, you can find a CodeGarden compatible container in the [Code Gardern Docker](https://github.com/Steveorevo/hestiacp-dockered) repository.

## Support the creator
You can help this author's open source development endeavors by donating any amount to Stephen J. Carnam @ Virtuosoft. Your donation, no matter how large or small helps pay for essential time and resources to create MIT and GPL licensed projects that you and the world can benefit from. Click the link below to donate today :)
<div>
         

[<kbd> <br> Donate to this Project <br> </kbd>][KBD]


</div>


<!---------------------------------------------------------------------------->

[KBD]: https://virtuosoft.com/donate

https://virtuosoft.com/donate
