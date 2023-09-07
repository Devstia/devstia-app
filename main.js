/**
 * Virtuosoft - CodeGarden PWS (Personal Web Server)
 * 
 * Provides a desktop application for managing CODE (Core Open Developer Elements)
 */

// Initialize our application
const app = require('electron').app;
app.on('ready', () => {

    // Read our settings
    const Settings = require('./settings.js');
    const pwsSettings = Settings.read();

    // Copy over our user customizable scripts folder
    const Util = require('./util.js');
    Util.appFolder = pwsSettings.appFolder;
    Util.allowOneInstance();
    Util.copyScripts();

    // Hide pull down menus
    const Menu = require('electron').Menu;
    const customMenu = Menu.buildFromTemplate([]);

    // Create our tray icon
    const VMS = require('./vms.js');
    VMS.pwsSettings = pwsSettings;
    const Tray = require('./tray.js');
    function createTray() {
        Tray.create();
        Tray.on('localhost', () => {
            // Write trusted token for auto-login, this verifies the source of the request
            const fs = require('fs');
            const path = require('path');
            const altFile = path.join(pwsSettings.appFolder, 'alt.txt');
            const altContent = Util.uuidv4().toString();
            fs.writeFileSync(altFile, altContent);
            const shell = require('electron').shell;
            shell.openExternal('http://localhost/?alt=' + altContent);
        });
        Tray.on('terminal', () => {
            const { spawn } = require('child_process');
            const path = require('path');
            const scriptTerminal = path.join(pwsSettings.appFolder, 'scripts', 'terminal.sh');
            console.log(scriptTerminal);
            const p = spawn(scriptTerminal, [pwsSettings.sshPort.toString()], {
                cwd: path.dirname(scriptTerminal),
                detached: true,
                stdio: 'ignore'
            });
            p.unref();
        });
        Tray.on('quit', (quitting) => {
            if (quitting == true) {
                VMS.shutdown();
            }
            return quitting;
        });
    }
    createTray();

    // Show the main application window state
    function showWindow() {
        const state = VMS.state();
        const Window = require('./window.js');
        Window.show('./web/' + state + '.html');

        // Download compatible VMS (virtual machine server) runtime
        if (state == 'download') {
            VMS.on('downloadProgress', (msg) => {
                let percent = msg.value;
                if (isNaN(percent)) percent = 0;
                Window.setElmTextById('progress', percent + '%');
            });
            VMS.on('downloadComplete', () => {
                showWindow(); // Done, re-check state, and extract
            });
            VMS.download();
        }
        
        // Extract the VMS archive runtime
        if (state == 'extract') {
            VMS.on('extractComplete', () => {
                showWindow(); // Done, re-check state, and start
            });
            VMS.extract();
        }

        // Start the VMS runtime
        if (state == 'startup') {
            VMS.on('startupComplete', () => {
                showWindow();
            });
            VMS.startup();
        }

        // Running state, enable menu items
        if (state == 'running') {
            Tray.setMenuState('localhost', true);
            Tray.setMenuState('terminal', true);
        }

        // Allow quitting the application when window is closed
        function QuitOnClose() {
            Window.on('closed', () => {
                Tray.quitting = true;
                VMS.quitting = true;
                
                // Give a second for pending dl/extract to quit
                setTimeout(() => {
                    app.quit();
                }, 1000);
            });
        }

        // Quit the application if we're not in startup/running state
        if (state != 'startup' && state != 'running') {
            QuitOnClose();
        };
        
        // Respond to VMS errors and quit
        function VMSError(msg) {
            Window.show('./web/error.html');
            Window.setElmTextById('error', msg.error);
            QuitOnClose();
        }
        VMS.on('downloadError', VMSError);
        VMS.on('extractError', VMSError);
        VMS.on('startupError', VMSError);
    }
    showWindow();

    // const ipcMain = require('electron').ipcMain;

    // // Handle request for getSetting from renderer process
    // ipcMain.on('test', (event, arg) => {
    //     console.log('test');
    //     // pwsSettings = readSettings();
    //     // arg.method = 'reply_getSetting';
    //     // arg.value = pwsSettings[arg.name];
    //     // event.sender.send(arg.uuid, arg);
    // });
});
