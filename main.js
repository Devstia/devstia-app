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

    // Allow only one instance of our application
    const fs = require('fs');
    const path = require('path');
    const lockFilePath = path.join(pwsSettings.appFolder, 'app.lock');
    if (fs.existsSync(lockFilePath)) {
      const lockFileContent = fs.readFileSync(lockFilePath, 'utf8');
      const lockFilePID = parseInt(lockFileContent, 10);
      if (lockFilePID && !process.kill(lockFilePID, 0)) {
        console.log('Previous instance terminated.');
      } else {
        console.error('Another instance is already running.');
        process.exit(1);
      }
    }
    fs.writeFileSync(lockFilePath, process.pid.toString());
    process.on('exit', () => {
      fs.unlinkSync(lockFilePath);
    });

    // Hide pull down menus
    const Menu = require('electron').Menu;
    const customMenu = Menu.buildFromTemplate([]);

    // Create our tray icon
    const Tray = require('./tray.js');
    Tray.create();

    // Show the main application window state
    function showWindow() {
        const Window = require('./window.js');
        const VMS = require('./vms.js'); 
        const state = VMS.state(pwsSettings);
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

        // // Running state
        // if (state == 'running') {
        //     QuitOnClose();
        // }

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
