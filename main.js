/**
 * Virtuosoft - CodeGarden PWS (Personal Web Server)
 * 
 * Provides a desktop application for managing CODE (Core Open Developer Elements)
 * TODO: rewrite everything using VueJS :)
 */

// Initialize our application
const app = require('electron').app;
global.ipcMain = require('electron').ipcMain;
global.Settings = require('./settings.js');
global.Util = require('./util.js');
global.VMS = require('./vms.js');
global.Window = require('./window.js');
global.Window.registerUIEvents();
global.Tray = require('./tray.js');
app.on('ready', () => {

    // TODO: On Windows, check for Hyper-V, if not enabled ask to enable/reboot

    // Read our settings
    //const Settings = require('./settings.js');
    const pwsSettings = global.Settings.read();

    // Copy over our user customizable scripts folder
    
    global.Util.appFolder = pwsSettings.appFolder;
    if (global.Util.allowOneInstance()) return;
    global.Util.copyScripts();

    // Hide pull down menus
    const Menu = require('electron').Menu;
    const customMenu = Menu.buildFromTemplate([]);

    // Create our tray icon
    //const VMS = require('./vms.js');
    global.VMS.pwsSettings = pwsSettings;
    function createTray() {
        global.Tray.create();
        global.Tray.on('localhost', () => {
            global.showLocalhost();
        });
        global.Tray.on('terminal', () => {
            global.showTerminal();
        });
        global.Tray.on('files', () => {
            global.showFiles();
        });
        global.Tray.on('settings', () => {
            showSettings();
        });
        global.Tray.on('quit', (quitting) => {
            return global.doQuitting(quitting);
        });
    }
    createTray();

    // Allow quitting the application when window is closed
    function QuitOnClose() {
        global.Window.quitOnClose = true;
        global.Window.on('closed', () => {
            global.Window.unregisterUIEvents();
            global.Tray.quitting = true;
            global.VMS.quitting = true;
            
            // Give a second for pending dl/extract to quit
            setTimeout(() => {
                app.quit();
            }, 1000);
        });
    }

    // Respond to VMS errors and quit
    function VMSError(msg) {
        global.Window.show('./web/error.html');
        global.Window.setElmTextById('error', msg.error);
        setTimeout(() => {
            QuitOnClose();
        }, 500);
    }
    global.VMS.on('downloadError', VMSError);
    global.VMS.on('extractError', VMSError);
    global.VMS.on('startupError', VMSError);
    global.VMS.on('showSettings', () => { showSettings(); });

    // Show the main application window state
    var vms_state = '';
    function showWindow() {
        vms_state = global.VMS.state();
        global.Window.show('./web/' + vms_state + '.html');

        // Download compatible VMS (virtual machine server) runtime
        if (vms_state == 'download') {
            global.VMS.on('downloadProgress', (msg) => {
                let percent = msg.value;
                if (isNaN(percent)) percent = 0;
                Window.setElmTextById('progress', percent + '%');
            });
            global.VMS.on('downloadComplete', () => {
                showWindow(); // Done, re-check state, and extract
            });
            global.VMS.download();
        }
        
        // Extract the VMS archive runtime
        if (vms_state == 'extract') {
            global.VMS.on('extractComplete', () => {
                showWindow(); // Done, re-check state, and start
            });
            global.VMS.extract();
        }

        // Start the VMS runtime
        if (vms_state == 'startup') {
            global.VMS.on('startupComplete', (msg) => {
                if (msg.value == false) { // Restarted = false
                    showWindow();
                }
            });
            global.VMS.startup();
        }

        // Running state, enable menu items
        if (vms_state == 'running') {
            global.Tray.setMenuState('localhost', true);
            global.Tray.setMenuState('terminal', true);
            global.Tray.setMenuState('files', (pwsSettings.fsMode.toLowerCase() != 'none'));
            global.Tray.setMenuState('settings', true);
        }

        // Quit the application if we're not in startup/running state
        if (vms_state == 'download' || vms_state == 'extract' || vms_state == 'error') {
            QuitOnClose();
        }else{
            global.Window.off('closed');
        };
    }
    showWindow();

    // Show the localhost webpage
    global.showLocalhost = function() {
        // Write trusted token for auto-login, this verifies the source of the request
        const altContent = global.Util.uuidv4().toString();
        global.VMS.sudo("echo '" + altContent + "' > /tmp/alt.txt");
        const shell = require('electron').shell;
        shell.openExternal('http://localhost/?alt=' + altContent);
    }

    // Show a terminal instance
    global.showTerminal = function() {
        const { spawn } = require('child_process');
        const path = require('path');
        const pwsSettings = global.Settings.read();
        const runtimePath = path.join(__dirname, 'runtime', process.platform + '_' +  process.arch, 'bin')
                + path.delimiter + `${process.env.PATH}${path.delimiter}`;
        let scriptTerminal = null;
        if (process.platform === 'win32') {
            scriptTerminal = path.join(pwsSettings.appFolder, 'scripts', 'terminal.bat');
        }else{
            scriptTerminal = path.join(pwsSettings.appFolder, 'scripts', 'terminal.sh');
        }
        console.log(scriptTerminal);
        const p = spawn(scriptTerminal, [pwsSettings.sshPort.toString()], {
            cwd: path.dirname(scriptTerminal),
            detached: true,
            stdio: 'ignore',
            env: { PATH: runtimePath }
        });
        p.unref();
    }

    // Show files from filesystem
    global.showFiles = function() {
        const os = require('os');
        if (os.platform() === 'darwin') {
            
            // Samba mount for macOS, works well and is fast.
            const { exec } = require('child_process');
            const pwsSettings = global.Settings.read();
            let cmd = `[ -n "$(mount -t smbfs | grep '/tmp/pws')" ] && { open /tmp/pws; } `;
            cmd += '|| { rm -rf /tmp/pws; mkdir -p /tmp/pws; mount -t smbfs //pws:';
            cmd += pwsSettings.pwsPass + '@local.dev.cc/PWS /tmp/pws && open /tmp/pws; }';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error mounting samba: ${error.message}`);
                    return;
                }
            });
        }else if (os.platform() === 'win32') {

            // WebDAV mount for Windows, works well and is fast.
            const { execSync } = require('child_process');
            const pwsSettings = global.Settings.read();
            try {
                execSync('net use P: https://webdav-pws.dev.cc /user:pws "' + pwsSettings.pwsPass + '"');
                execSync(`powershell -Command "$a = New-Object -ComObject shell.application; $a.NameSpace('P:\\').self.name = 'PWS'"`);
            }catch(err) {
                console.error(`Error mounting webdav: ${err.message}`);
            }
            execSync("IF EXIST P:\\ (start P:)");
        }else{
            // TODO: Support for Linux
        }
    }

    // Show the settings window
    function showSettings() {
        //const Window = require('./window.js');
        global.Window.show('./web/settings.html');
        
        // From system tab
        // global.Window.on('localhost', () => {
        //     showLocalhost();
        // });
        // global.Window.on('terminal', () => {
        //     showTerminal();
        // });
        // global.Window.on('files', () => {      
        //     showFiles();
        // });
        // global.Window.on('quit', (quitting) => {
        //     global.Tray.quitting = doQuitting(quitting);
        //     global.Window.close();
        // });
    }

    // Quit the application
    global.doQuitting = function(quitting) {
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
            }else if (os.platform() === 'win32') {

                // Unmount WebDAV share for Windows
                if (pwsSettings.fsMode.toLowerCase() == 'webdav') {
                    const { exec } = require('child_process');
                    let cmd = 'net use P: /delete';
                    exec(cmd, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error unmounting webdav: ${error.message}`);
                            return;
                        }
                    });
                }
            }else{
                // TODO: Support for Linux
            }
            global.VMS.shutdown(function() {
                app.quit();
            });
        }
        return quitting;
    }
});

// Prevent the application from closing when all windows are closed
app.on('window-all-closed', (event) => {
    if (global.Window.quitOnClose != true) event.preventDefault();
});
app.on('before-quit', () => {
    global.Window.close();
});
