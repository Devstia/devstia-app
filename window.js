const { StringDecoder } = require('string_decoder');

/**
 * Window object represent our main application window.
 */
const Settings = global.Settings;
const ipcMain = global.ipcMain;
const VMS = global.VMS;
var Window = {

    // Properties
    quitOnClose: false,
    listeners: [],
    win: null,

    // Methods
    /**
     * alert - Displays an alert dialog with the given title and message.
     * @param {string} title - the title of the alert dialog.
     * @param {string} message - the message to display in the alert dialog.
     */
    alert: function(title, message) {
        const dialog = require('electron').dialog;
        const nativeImage = require('electron').nativeImage;
        const app = require('electron').app;
        if (process.platform === 'darwin') {
            app.dock.show();
        }
        dialog.showMessageBoxSync({
            type: 'info',
            message: message,
            title: 'Devstia Preview - ' + title,
            icon: nativeImage.createFromPath(`${app.getAppPath()}/images/dev_pw.png`)
        });
    },
    /**
     * close - Closes the main application window.
     */
    close: function() {
        if (this.win == null) return;
        this.win.close();
        this.win = null;
    },
    /**
     * executeJavaScript - Executes the given JavaScript code in the main window.
     * @param {string} script 
     */
    executeJavaScript: function(script) {
        if (this.win == null) return;
        try {
            this.win.webContents.executeJavaScript(script);
        }catch(error) {
            console.error(error);
        }
    },
    /**
     * show - Shows application window with the given file and optional dimensions.
     * @param {*} file contains the URL to load.
     * @param {object} size optional size object with width and height properties.
     */
    show: function(file = './web/index.html', size = { width: 620, height: 450} ) {
        this.quitOnClose = false;
        if (process.platform == 'win32') {
            size.width += 5;
            size.height += 3;
        }
        if (this.win == null) {
            
            // Handle UI events
            const BrowserWindow = require('electron').BrowserWindow;
            const path = require('path');
            let winOptions = {
                width: size.width,
                height: size.height,
                modal: true,
                title: 'Devstia Preview',
                maximizable: false,
                minimizable: false,
                resizable: false,
                show: false,
                icon: './images/dev_pw.png',
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    devTools: false
                }
            }
            this.win = new BrowserWindow(winOptions);
            this.win.setMenu(null);
            this.win.setMenuBarVisibility(false);
            this.win.on('closed', () => {
                const app = require('electron').app;
                if (process.platform === 'darwin') {
                    app.dock.hide();
                }
                if (this.quitOnClose == true) {
                    global.doQuitting();
                }
                this.win = null;
            });
            this.win.webContents.on('did-finish-load', () => {
                if (this.win == null) return;
                
                // Set initial theme mode (light/dark)
                const nativeTheme = require('electron').nativeTheme;
                if (nativeTheme.shouldUseDarkColors) {
                    this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('dark');");
                } else {
                    this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('light');");
                }
    
                // Dynamically update the light/dark theme on OS settings change
                nativeTheme.on('updated', () => {
                    if (this.win == null) return;
                    if (this.win.webContents == null) return;
                    if (nativeTheme.shouldUseDarkColors) {
                        this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('dark');");
                    } else {
                        this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('light');");
                    }
                });
                if (process.platform === 'darwin') {
                    const app = require('electron').app;
                    app.dock.show();
                }
                if (file.indexOf('settings.html') > -1) {
                    let pwSettings = Settings.read();
                    this.executeJavaScript('fillOutSettings(' + JSON.stringify(pwSettings) + ');');
                    if (pwSettings.fsMode.toLowerCase() == 'none') {
                        this.executeJavaScript("$('#files').addClass('disabled');");
                    }
                }
                setTimeout(() => { if (this.win != null) { this.win.show(); } }, 300);
            });
            this.win.setSize(size.width, size.height + (process.platform === 'darwin' ? 3 : 0));
            this.win.loadFile(file);
        }else{
            this.close();
            setTimeout(() => { 
                this.show(file, size); 
            }, 500);
        }
    },

    /**
     * setElmTextById - updates the text within the given element by id.
     * @param {string} id - the id of the element to update.
     * @param {string} text - the inner text to set the element content to.
     */
    setElmTextById: function(id, text) {
        if (this.win == null) return;
        text = JSON.stringify(text);
        try {
            let script = "if (document.getElementById('" + id + "') != null) {\n";
            script += "    document.getElementById('" + id + "').innerText = " + text + ";\n";
            script += "}else{\n"; // Retry in 1 second if element not found
            script += "    setTimeout(() => {\n";
            script += "        if (document.getElementById('" + id + "') != null) {\n";
            script += "            document.getElementById('" + id + "').innerText = " + text + ";\n";
            script += "        }\n";
            script += "    }, 1000);\n";
            script += "}\n";
            this.win.webContents.executeJavaScript(script);
        }catch(error) {
            console.error(error);
        }
    },

    /**
     * registerUIEvents - Handles user interface events from the window.
     */
    registerUIEvents: function() {

        // Handle request to allow quit on window close
        ipcMain.on('allowQuitOnClose', function(event, arg) {
            global.Window.quitOnClose = arg;
        });

        // Handle request for server status
        ipcMain.on('checkStatus', function(event, arg) {
            VMS.checkStatus().then((result) => {
                console.log(`Command Result: ${result}`);
                try {
                    event.sender.send(arg.uuid, result);
                }catch(error) {
                    console.error(error);
                }
            })
            .catch((error) => {
                console.error(`Error executing VMS.checkStatus command: ${error}`);
            });
        });

        // Handle showTipsDone for first time users
        ipcMain.on('showTipsDone', (event, args) => {
            let pwSettings = Settings.read();
            pwSettings.showTips = false;
            Settings.save(pwSettings);
            VMS.pwSettings = pwSettings;
        });

        // Handle request for opening external http/s links
        ipcMain.on('openLink', (event, url) => {
            if (typeof url != 'string') return;
            const urlPattern = /^(https?|ftp):\/\//i; // sanitize
            if ( urlPattern.test(url) ) {
                require('electron').shell.openExternal(url);
            }
        });

        // Handle saving settings
        ipcMain.on('savePass', function(event, newSettings) {
            let pwSettings = Settings.read();
            if (newSettings.pwPass != pwSettings.pwPass) {
                VMS.updatePassword(newSettings.pwPass);
                pwSettings.pwPass = newSettings.pwPass;
                Settings.save(pwSettings);
                VMS.pwSettings = pwSettings;
                event.sender.send(newSettings.uuid);
            }
        });

        // Handle system requests
        ipcMain.on('queryTrayMenu', function(event, arg) {
            if (global.Tray.getMenuState('localhost') == true) {
                event.sender.send(arg.uuid);
            }
        });
        ipcMain.on('erase', function(event, arg) {
            const prompt = require('electron-prompt');
            prompt({
                title: 'Devstia Preview - WARNING',
                label: '<div style="font-size:smaller;"><span style="font-weight: bold;">WARNING:</span> This will destroy all sites and reset the server installation. <br>Please type "ERASE" to confirm.</div>',
                value: '',
                inputAttrs: {
                    type: 'text'
                },
                type: 'input',
                useHtmlLabel: true,
                width: 480,
                height: 210
            }).then((r) => {
                if(r === null) {
                    event.sender.send(arg.uuid);
                    return;
                } else {
                    if (r === 'ERASE') {
                        global.Window.executeJavaScript("$('#close-button').addClass('disabled');showSystemWaiting('Erasing server...');document.getElementById('close-button').addClass('disabled');");
                        VMS.erase();
                        setTimeout(function() {

                            global.Window.executeJavaScript("showSystemWaiting('Re-installing server... <span id=\"txtReinstallPercent\"></span><br> Please wait');");
                            VMS.on('extractProgress', (msg) => {
                                let percent = msg.value;
                                if (isNaN(percent)) percent = 0;
                                Window.setElmTextById('txtReinstallPercent', percent + '%');
                            });
                            VMS.extract(function() {
                                global.Window.executeJavaScript("$('.badge').css('opacity', '20%');showStatusWait();hideSystemWaiting();$('#close-button').removeClass('disabled');");
                                VMS.startup(true); // restarted
                                event.sender.send(arg.uuid);
                            });
                        }, 10000);
                    }else{
                        const { dialog, app } = require('electron');
                        const path = require('path');

                        // Show the custom error message box
                        const options = {
                            type: 'error',
                            title: 'Devstia Preview - Invalid Input',
                            message: 'Incorrect validation.',
                            detail: 'Please type "ERASE" to confirm.',
                            buttons: ['OK'],
                            icon: path.join(app.getAppPath(), 'images/dev_pw.png')
                        };
                        dialog.showMessageBox(options);
                        event.sender.send(arg.uuid);
                    }    
                }
            })
        });
        ipcMain.on('localhost', function(event, arg) {
            global.showLocalhost();
        });
        ipcMain.on('terminal', function(event, arg) {
            global.showTerminal();
        });
        ipcMain.on('files', function(event, arg) {
            global.showFiles();
        });
        ipcMain.on('restartServer', function(event, arg) {
            VMS.restart(function() {
                event.sender.send(arg.uuid);
            });
        });
        ipcMain.on('quit', function(event, arg) {
            global.doQuitting();
            global.Window.close();
        });

        // Handle snapshot requests
        ipcMain.on('createSnapshot', function(event, arg) {
            const { dialog } = require('electron');
            const os = require('os');
            const path = require('path');

            // Show the save dialog with default filename
            const date = new Date();
            const month = date.toLocaleString('default', { month: 'short' }).toLowerCase();
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear().toString();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const fileName = `devstia-${month}-${day}-${year}-${hours}${minutes}.img`;
            const options = {
                title: 'Save Snapshot Image',
                defaultPath: path.join(os.homedir(), fileName),
                buttonLabel: 'Save',
                filters: [
                    { name: 'Snapshot Image', extensions: ['img'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            };
            dialog.showSaveDialog(options).then(result => {
                if (result.canceled) {
                    event.sender.send(arg.uuid);
                    return;
                }
                const filePath = result.filePath;
                const pwFile = process.arch == 'arm64' ? 'devstia-arm64.img' : 'devstia-amd64.img';
                let pwSettings = Settings.read();
                const vmsFilePath = path.join(pwSettings.vmsFolder, pwFile);
                Window.executeJavaScript("$('#close-button').addClass('disabled');showSystemWaiting('Stopping server...');");
                VMS.shutdown(function() {
                    global.Window.executeJavaScript("showSystemWaiting('Creating snapshot...<br> Please wait');");

                    // Copy the current vms file to the selected location
                    const fs = require('fs');
                    fs.copyFile(vmsFilePath, filePath, (err) => {
                        if (err) throw err;
                        global.Window.executeJavaScript("showSystemWaiting('Resuming the server...');");
                        setTimeout(function() {
                            global.Window.executeJavaScript("$('.badge').css('opacity', '20%');showStatusWait();hideSystemWaiting();$('#close-button').removeClass('disabled');");
                            VMS.startup(true); // restarted
                        }, 3000);
                    });
                    event.sender.send(arg.uuid);
                });
            }).catch(err => {
                console.error(err);
            });
        });
        ipcMain.on('restoreSnapshot', function(event, arg) {
            const { dialog } = require('electron');

            // Show the file selector dialog
            const options = {
                title: 'Select Snapshot Image',
                buttonLabel: 'Select',
                filters: [
                    { name: 'Snapshot Files', extensions: ['img'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            };

            dialog.showOpenDialog(options).then(result => {
                if (!result.canceled) {

                    // Show the confirmation dialog
                    const filePath = result.filePaths[0];
                    const app = require('electron').app;
                    const nativeImage = require('electron').nativeImage;
                    const confirmOptions = {
                        type: 'warning',
                        title: 'Restore Snapshot',
                        message: 'Restoring the snapshot will delete and replace your current running server. Are you sure?',
                        buttons: ['Yes', 'No'],
                        icon: nativeImage.createFromPath(`${app.getAppPath()}/images/dev_pw.png`),
                        defaultId: 1,
                        cancelId: 1
                    };

                    dialog.showMessageBox(confirmOptions).then(result => {
                        if (result.response === 0) {

                            // Restore the selected snapshot
                            global.Window.executeJavaScript("$('#close-button').addClass('disabled');showSystemWaiting('Stopping server...');");
                            VMS.erase(function() {
                                global.Window.executeJavaScript("showSystemWaiting('Restoring server...<br> Please wait');");
                                VMS.restore(filePath, function() {
                                    global.Window.executeJavaScript("$('.badge').css('opacity', '20%');showStatusWait();hideSystemWaiting();$('#close-button').removeClass('disabled');");
                                    VMS.startup(true); // restarted
                                    event.sender.send(arg.uuid);
                                });
                            });
                            console.log(`File selected: ${filePath}`);
                        }else{
                            event.sender.send(arg.uuid);
                        }
                    }).catch(err => {
                        console.error(err);
                    });
                }else{
                    event.sender.send(arg.uuid);
                }
            }).catch(err => {
                console.error(err);
            });
        });

        // Handle security requests
        ipcMain.on('showMasterCert', function(event) {
            let pwSettings = Settings.read();
            const masterCert = require('path').join(pwSettings.appFolder, 'security', 'ca', 'dev.pw.crt');
            require('electron').shell.showItemInFolder(masterCert);
        });
        ipcMain.on('regenCerts', function(event, arg) {

            // Confirm dialog to regenerate certificates
            const { dialog } = require('electron');
            const app = require('electron').app;
            const nativeImage = require('electron').nativeImage;
            const confirmOptions = {
                type: 'warning',
                title: 'Devstia Preview - Regenerate Certificates',
                message: 'Regenerating certificates will delete and replace the master certificate and all current website certificates. Are you sure?',
                buttons: ['Yes', 'No'],
                icon: nativeImage.createFromPath(`${app.getAppPath()}/images/dev_pw.png`),
                defaultId: 1,
                cancelId: 1
            };
            const choice = dialog.showMessageBoxSync(confirmOptions);
            if (choice === 0) { // If 'Yes' is clicked
                VMS.regenerateCertificates();
            }
            event.sender.send(arg.uuid);
        });
        ipcMain.on('showSSHKeys', function(event) {
            let pwSettings = Settings.read();
            const sshKey = require('path').join(pwSettings.appFolder, 'security', 'ssh', 'devstia_rsa.pub');
            require('electron').shell.showItemInFolder(sshKey);
        });
        ipcMain.on('regenKeys', function(event, arg) {

            // Confirm dialog to regenerate keys
            const { dialog } = require('electron');
            const app = require('electron').app;
            const nativeImage = require('electron').nativeImage;
            const confirmOptions = {
                type: 'warning',
                title: 'Devstia Preview - Regenerate SSH Keys',
                message: 'Regenerating SSH keys will delete and replace the current SSH keys. Are you sure?',
                buttons: ['Yes', 'No'],
                icon: nativeImage.createFromPath(`${app.getAppPath()}/images/dev_pw.png`),
                defaultId: 1,
                cancelId: 1
            };
            const choice = dialog.showMessageBoxSync(confirmOptions);
            if (choice === 0) { // If 'Yes' is clicked
                VMS.regenerateSSHKeys();
            }
            event.sender.send(arg.uuid);
        });
    },

    /**
     * unregisterUIEvents - Unregisters all UI events.
     */
    unregisterUIEvents: function() {
        ipcMain.removeAllListeners('checkStatus');
        ipcMain.removeAllListeners('openLink');
        ipcMain.removeAllListeners('savePass');
        ipcMain.removeAllListeners('erase');
        ipcMain.removeAllListeners('localhost');
        ipcMain.removeAllListeners('terminal');
        ipcMain.removeAllListeners('files');
        ipcMain.removeAllListeners('restartServer');
        ipcMain.removeAllListeners('quit');
        ipcMain.removeAllListeners('createSnapshot');
        ipcMain.removeAllListeners('restoreSnapshot');
        ipcMain.removeAllListeners('showMasterCert');
        ipcMain.removeAllListeners('regenCerts');
        ipcMain.removeAllListeners('showSSHKeys');
        ipcMain.removeAllListeners('regenKeys');
    }
};
module.exports = Window;