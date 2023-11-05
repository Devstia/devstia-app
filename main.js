/**
 * Virtuosoft - Devstria Preview (a localhost development server)
 * 
 * TODO: rewrite everything using VueJS :)
 */

// Initialize our application
const app = require('electron').app;
global.ipcMain = require('electron').ipcMain;
global.Settings = require('./settings.js');
global.Util = require('./util.js');
global.VMS = require('./vms.js');
global.Window = require('./window.js');
global.Tray = require('./tray.js');
global.Menu = require('electron').Menu;

app.on('ready', () => {

    // On Windows, check for Hyper-V, if not enabled ask to enable/reboot
    if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        const stdout = execSync('powershell -Command get-service | findstr vmcompute');
        if (stdout.indexOf('Hyper-V') == -1) {

            // Display message to user to enable Hyper-V
            const { dialog } = require('electron');
            const options = {
                type: 'info',
                title: 'Devstia Preview - Hyper-V is not enabled',
                message: "Hyper-V is not enabled, please enable it.\n\nClick Windows' Start button, type \"Turn Windows Features on or off\", check Hyper-V.",
                buttons: ['OK']
            };
            dialog.showMessageBox(null, options).then( (response) => {
                app.quit();
            });
            return;
        }
    }

    // Read our settings
    const pwSettings = global.Settings.read();
    Window.registerUIEvents();

    // Copy over our user customizable scripts folder   
    Util.appFolder = pwSettings.appFolder;
    if (Util.allowOneInstance()) return;
    Util.copyScripts();

    // Hide pull down menus
    const customMenu = Menu.buildFromTemplate([]);

    // Create our tray icon
    VMS.pwSettings = pwSettings;
    function createTray() {
        Tray.create();
        Tray.on('localhost', () => {
            showLocalhost();
        });
        Tray.on('terminal', () => {
            showTerminal();
        });
        Tray.on('files', () => {
            showFiles();
        });
        Tray.on('settings', () => {
            showSettings();
        });
        Tray.on('quit', () => {
            global.doQuitting();
        });
    }
    createTray();

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
    VMS.on('showSettings', () => { showSettings(); });

    // Show the main application window state
    var vms_state = '';
    function showWindow() {
        vms_state = global.VMS.state();
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
            VMS.on('startupComplete', (msg) => {
                if (msg.value == false) { // Restarted = false
                    showWindow();
                }
            });
            VMS.startup();
        }

        // Running state, enable menu items
        if (vms_state == 'running') {
            Tray.setMenuState('localhost', true);
            Tray.setMenuState('terminal', true);
            Tray.setMenuState('files', (pwSettings.fsMode.toLowerCase() != 'none'));
            Tray.setMenuState('settings', true);
        }

        // Allow quit the application if we're not in startup/running state
        if (vms_state == 'download' || vms_state == 'extract' || vms_state == 'error') {
            Window.quitOnClose = true;
        }else{
            Window.quitOnClose = false;
        }
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
        const pwSettings = Settings.read();
        const runtimePath = path.join(__dirname, 'runtime', process.platform + '_' +  process.arch, 'bin')
                + path.delimiter + `${process.env.PATH}${path.delimiter}`;
        let scriptTerminal = null;
        if (process.platform === 'win32') {
            scriptTerminal = path.join(pwSettings.appFolder, 'scripts', 'terminal.bat');
        }else{
            scriptTerminal = path.join(pwSettings.appFolder, 'scripts', 'terminal.sh');
        }
        console.log(scriptTerminal);
        const p = spawn(scriptTerminal, [pwSettings.sshPort.toString()], {
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
            const pwSettings = Settings.read();
            let cmd = `[ -n "$(mount -t smbfs | grep '/tmp/devstia')" ] && { open /tmp/devstia; } `;
            cmd += '|| { rm -rf /tmp/devstia; mkdir -p /tmp/devstia; mount -t smbfs //devstia:';
            cmd += pwSettings.pwPass + '@local.dev.pw/Devstia /tmp/devstia && open /tmp/devstia; }';
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error mounting samba: ${error.message}`);
                    return;
                }
            });
        }else if (os.platform() === 'win32') {

            // WebDAV mount for Windows, works well and is fast.
            const { execSync } = require('child_process');
            const pwSettings = Settings.read();
            try {
                execSync('net use P: https://webdav-devstia.dev.pw /user:devstia "' + pwSettings.pwPass + '"');
                execSync(`powershell -Command "$a = New-Object -ComObject shell.application; $a.NameSpace('P:\\').self.name = 'Devstia'"`);
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
        Window.show('./web/settings.html');
    }

    // Quit the application
    //global.doQuitting = function(quitting) {
    global.doQuitting = function() {
        VMS.quitting = true;

        // if (quitting == true) {
            const os = require('os');
            if (os.platform() === 'darwin') {

                // Unmount Samba share for macOS
                if (pwSettings.fsMode.toLowerCase() == 'samba') {
                    const { exec } = require('child_process');
                    let cmd = 'umount /tmp/devstia && rm -rf /tmp/devstia';
                    exec(cmd, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error unmounting samba: ${error.message}`);
                            return;
                        }
                    });
                }
            }else if (os.platform() === 'win32') {

                // Unmount WebDAV share for Windows
                if (pwSettings.fsMode.toLowerCase() == 'webdav') {
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
            VMS.shutdown(function() {
                app.quit();
            });
    }
});

// Prevent the application from closing when all windows are closed
app.on('window-all-closed', (event) => {
    if (Window.quitOnClose != true) event.preventDefault();
});
app.on('before-quit', () => {
    Window.close();
});
