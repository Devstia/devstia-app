/**
 * Virtuosoft - CodeGarden PWS (Personal Web Server)
 * 
 * Provides a desktop application for managing CODE (Core Open Developer Elements)
 */

// Initialize our application
const app = require('electron').app;
const Window = require('./window.js');
app.on('ready', () => {

    // Read our settings
    const Settings = require('./settings.js');
    const pwsSettings = Settings.read();
    Settings.uiEvents();

    // Copy over our user customizable scripts folder
    const Util = require('./util.js');
    Util.appFolder = pwsSettings.appFolder;
    Util.allowOneInstance();
    Util.copyScripts();

// TODO: implement rclone webdav services on 8088 in lieu of fsdev local 
// const { spawn } = require('child_process');

// // Spawn the rclone process
// const rcloneProcess = spawn('rclone', ['serve', 'webdav', 'C:\\tmp', '--baseurl', '/appFolder', '--user', 'pws', '--pass', 'personal-web-server', '--addr', 'localhost:8088']);

// // Handle the exit event
// function handleExit() {
//   // Kill the rclone process
//   rcloneProcess.kill();
//   // Exit the app
//   process.exit();
// }

// // Handle the app exit event
// app.on('before-quit', handleExit);
// app.on('window-all-closed', handleExit);


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
            const pwsSettings = Settings.read();
            const altFile = path.join(pwsSettings.appFolder, 'alt.txt');
            const altContent = Util.uuidv4().toString();
            fs.writeFileSync(altFile, altContent);
            const shell = require('electron').shell;
            shell.openExternal('http://localhost/?alt=' + altContent);
        });
        Tray.on('terminal', () => {
            const { spawn } = require('child_process');
            const path = require('path');
            const pwsSettings = Settings.read();
            const scriptTerminal = path.join(pwsSettings.appFolder, 'scripts', 'terminal.sh');
            console.log(scriptTerminal);
            const p = spawn(scriptTerminal, [pwsSettings.sshPort.toString()], {
                cwd: path.dirname(scriptTerminal),
                detached: true,
                stdio: 'ignore'
            });
            p.unref();
        });
        Tray.on('files', () => {
            const os = require('os');
            if (os.platform() === 'darwin') {
                // Samba mount for macOS, works well and is fast.
                const { exec } = require('child_process');
                const pwsSettings = Settings.read();
                let cmd = 'rm -rf /tmp/pws ; mkdir -p /tmp/pws ; mount -t smbfs //pws:' + pwsSettings.pwsPass;
                cmd +='@local.dev.cc/PWS /tmp/pws ; open /tmp/pws';
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error mounting samba: ${error.message}`);
                        return;
                    }
                });
            }else{

            }
// WebDAV mount for macOS (not working well, drops files)
//                 const { exec } = require('child_process');
//                 const pwsPass = pwsSettings.pwsPass;
//                 const script = `osascript <<END
//                     mount volume "https://webdav-pws.dev.cc" as user name "pws" with password "${pwsSettings.pwsPass}"
//                     do shell script "open /Volumes/webdav-pws.dev.cc"
// END`;
//                 exec(script, (error, stdout, stderr) => {
//                     if (error) {
//                       console.error(`Error executing the script: ${error.message}`);
//                       return;
//                     }
//                 });

        });
        Tray.on('settings', () => {
            const Window = require('./window.js');
            Window.show('./web/settings.html', {width:620, height: 450});
            Window.executeJavaScript('fillOutSettings(' + JSON.stringify(Settings.read()) + ');');
        });
        Tray.on('quit', (quitting) => {
            if (quitting == true) {
                const os = require('os');
                if (os.platform() === 'darwin') {

                    // Unmount Samba share for macOS
                    if (pwsSettings.fsMode.toLowerCase() == 'samba') {
                        const { exec } = require('child_process');
                        let cmd = 'umount /tmp/pws && rm -rf /tmp/pws';
                        exec(cmd, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error unmounting samba: ${error.message}`);
                                return;
                            }
                        });
                    }
                }
                VMS.shutdown();
            }
            return quitting;
        });
    }
    createTray();

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

    // Respond to VMS errors and quit
    function VMSError(msg) {
        Window.show('./web/error.html');
        Window.setElmTextById('error', msg.error);
        setTimeout(() => {
            QuitOnClose();
        }, 500);
    }
    VMS.on('downloadError', VMSError);
    VMS.on('extractError', VMSError);
    VMS.on('startupError', VMSError);

    // Show the main application window state
    var vms_state = '';
    function showWindow() {
        vms_state = VMS.state();
        Window.show('./web/' + vms_state + '.html');

        // Download compatible VMS (virtual machine server) runtime
        if (vms_state == 'download') {
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
        if (vms_state == 'extract') {
            VMS.on('extractComplete', () => {
                showWindow(); // Done, re-check state, and start
            });
            VMS.extract();
        }

        // Start the VMS runtime
        if (vms_state == 'startup') {
            VMS.on('startupComplete', () => {
                showWindow();
            });
            VMS.startup();
        }

        // Running state, enable menu items
        if (vms_state == 'running') {
            Tray.setMenuState('localhost', true);
            Tray.setMenuState('terminal', true);
            Tray.setMenuState('files', (pwsSettings.fsMode.toLowerCase() != 'none'));
            Tray.setMenuState('settings', true);
        }

        // Quit the application if we're not in startup/running state
        if (vms_state == 'download' || vms_state == 'extract' || vms_state == 'error') {
            QuitOnClose();
        }else{
            Window.off('closed');
        };
    }
    showWindow();

    // Handle reinstall
    const ipcMain = require('electron').ipcMain;
    ipcMain.on('reinstall', function(event, arg) {
        showWindow();
    });
});
app.on('before-quit', () => {
    Window.close();
});

