const { StringDecoder } = require('string_decoder');

/**
 * Window object represent our main application window.
 */
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
            title: 'CodeGarden - ' + title,
            icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
        });
    },
    /**
     * close - Closes the main application window.
     */
    close: function() {
        if (this.win == null) return;
        this.win.close();
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
    invoke: function(event, arg) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event) {
                arg = this.listeners[i].callback(arg);
            }
        }
        return arg;
    },
    /**
     * off - Unregisters a listener for the given event.
     * @param {string} event 
     */
    off: function(event) {
        this.listeners = this.listeners.filter(listener => listener.event !== event);
    },
    /**
     * on - Registers a listener for the given event.
     * @param {string} event 
     * @param {function} callback 
     */
    on: function(event, callback) {
        this.listeners.push({event: event, callback: callback});
    },
    /**
     * show - Shows application window with the given file and optional dimensions.
     * @param {*} file contains the URL to load.
     * @param {object} size optional size object with width and height properties.
     */
    show: function(file = './web/index.html', size = { width: 620, height: 450} ) {
        if (this.win == null) {
            
            // Handle UI events
            const BrowserWindow = require('electron').BrowserWindow;
            const path = require('path');
            let winOptions = {
                width: size.width,
                height: size.height,
                modal: true,
                title: 'CodeGarden PWS',
                maximizable: false,
                minimizable: false,
                resizable: true,
                show: false,
                icon: './images/cg.png',
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js')
                    //devTools: false
                }
            }
            this.win = new BrowserWindow(winOptions);
            //this.win.setMenu(null);
            this.win.on('closed', () => {
//                this.unregisterUIEvents();
                const app = require('electron').app;
                if (process.platform === 'darwin') {
                    app.dock.hide();
                }
                this.listeners = [];
                this.invoke('closed');
                this.win = null;
            });
            this.win.webContents.on('did-finish-load', () => {
    
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
                let pwsSettings = global.Settings.read();
                this.executeJavaScript('fillOutSettings(' + JSON.stringify(pwsSettings) + ');');
                if (pwsSettings.fsMode.toLowerCase() == 'none') {
                    this.executeJavaScript("$('#files').addClass('disabled');");
                }
                setTimeout(() => { this.win.show(); }, 300);
            });
            this.win.setSize(size.width, size.height + (process.platform === 'darwin' ? 3 : 0));
            this.win.loadFile(file);
        }else{
            this.close();
            setTimeout(() => { this.show(file, size); }, 1000);
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
        //const Window = require('./window.js');
        //const VMS = require('./vms.js');
        //const self = this;

        // Handle request for server status
        console.log("Setting up uiEvents!!!");
        global.ipcMain.on('checkStatus', function(event, arg) {
            global.VMS.checkStatus().then((result) => {
                console.log(`Command Result: ${result}`);
                try {
                    event.sender.send(arg.uuid, result);
                }catch(error) {
                    console.error(error);
                }
            })
            .catch((error) => {
                console.error(`Error executing Settings.checkStatus command: ${error}`);
            });
        });

        // Handle request for opening external http/s links
        global.ipcMain.on('openLink', (event, url) => {
            if (typeof url != 'string') return;
            const urlPattern = /^(https?|ftp):\/\//i; // sanitize
            if ( urlPattern.test(url) ) {
                require('electron').shell.openExternal(url);
            }
        });

        // Handle saving settings
        global.ipcMain.on('savePass', function(event, newSettings) {
            let pwsSettings = global.Settings.read();
            if (newSettings.pwsPass != pwsSettings.pwsPass) {
                global.VMS.updatePassword(newSettings.pwsPass);
                pwsSettings.pwsPass = newSettings.pwsPass;
                global.Settings.save(pwsSettings);
                global.VMS.pwsSettings = pwsSettings;
                event.sender.send(newSettings.uuid);
            }
        });

        // Handle system requests
        global.ipcMain.on('erase', function(event, arg) {
            const prompt = require('electron-prompt');
            prompt({
                title: 'CodeGarden - WARNING',
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
                    console.log('user cancelled');
                } else {
                    if (r === 'ERASE') {
                        global.Window.executeJavaScript("$('#close-button').addClass('disabled');showWaitingSystem('Erasing server...');document.getElementById('close-button').addClass('disabled');");
                        global.VMS.erase();
                        setTimeout(function() {
                            global.Window.executeJavaScript("showWaitingSystem('Re-installing server...<br> Please wait');");
                            global.VMS.extract(function() {
                                global.Window.executeJavaScript("$('.badge').css('opacity', '20%');$('#status-waiting').show();hideWaitingSystem();$('#close-button').removeClass('disabled');");
                                global.VMS.startup(true); // restarted
                            });
                        }, 10000);
                    }else{
                        const { dialog, app } = require('electron');
                        const path = require('path');

                        // Show the custom error message box
                        const options = {
                            type: 'error',
                            title: 'CodeGarden - Invalid Input',
                            message: 'Incorrect validation.',
                            detail: 'Please type "ERASE" to confirm.',
                            buttons: ['OK'],
                            icon: path.join(app.getAppPath(), 'images/cg.png')
                        };
                        dialog.showMessageBox(options);
                    }    
                }
            })
        });
        global.ipcMain.on('localhost', function(event, arg) {
            //event.returnValue = global.Window.invoke('localhost', arg);
            global.showLocalhost();
        });
        global.ipcMain.on('terminal', function(event, arg) {
            //event.returnValue = global.Window.invoke('terminal', arg);
            global.showTerminal();
        });
        global.ipcMain.on('files', function(event, arg) {
            //event.returnValue = global.Window.invoke('files', arg);
            global.showFiles();
        });
        global.ipcMain.on('restartServer', function(event, arg) {
            global.VMS.restart(function() {
                event.sender.send(arg.uuid);
            });
        });
        global.ipcMain.on('quit', function(event, arg) {
            //event.returnValue = global.Window.invoke('quit', arg);
            global.Tray.quitting = global.doQuitting(true);
            global.Window.close();
        });

        // Handle snapshot requests
        global.ipcMain.on('createSnapshot', function(event, arg) {
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
            const fileName = `pws-${month}-${day}-${year}-${hours}${minutes}.img`;
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
                if (result.canceled) return;
                const filePath = result.filePath;
                const pwsFile = process.arch == 'arm64' ? 'pws-arm64.img' : 'pws-amd64.img';
                let pwsSettings = global.Settings.read();
                const vmsFilePath = path.join(pwsSettings.vmsFolder, pwsFile);
                Window.executeJavaScript("$('#close-button').addClass('disabled');showWaitingSystem('Stopping server...');");
                global.VMS.shutdown(function() {
                    global.Window.executeJavaScript("showWaitingSystem('Creating snapshot...<br> Please wait');");

                    // Copy the current vms file to the selected location
                    const fs = require('fs');
                    fs.copyFile(vmsFilePath, filePath, (err) => {
                        if (err) throw err;
                        global.Window.executeJavaScript("showWaitingSystem('Resuming the server...');");
                        setTimeout(function() {
                            global.Window.executeJavaScript("$('.badge').css('opacity', '20%');$('#status-waiting').show();hideWaitingSystem();$('#close-button').removeClass('disabled');");
                            global.VMS.startup(true); // restarted
                        }, 3000);
                    });
                });
            }).catch(err => {
                console.error(err);
            });
        });
        global.ipcMain.on('restoreSnapshot', function(event, arg) {
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
                        icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`),
                        defaultId: 1,
                        cancelId: 1
                    };

                    dialog.showMessageBox(confirmOptions).then(result => {
                        if (result.response === 0) {
                            // Restore the selected snapshot
                            global.Window.executeJavaScript("$('#close-button').addClass('disabled');showWaitingSystem('Stopping server...');");
                            global.VMS.erase(function() {
                                global.Window.executeJavaScript("showWaitingSystem('Restoring server...<br> Please wait');");
                                global.VMS.restore(filePath, function() {
                                    global.Window.executeJavaScript("$('.badge').css('opacity', '20%');$('#status-waiting').show();hideWaitingSystem();$('#close-button').removeClass('disabled');");
                                    global.VMS.startup(true); // restarted
                                });
                            });
                            console.log(`File selected: ${filePath}`);
                        }
                    }).catch(err => {
                        console.error(err);
                    });
                }
            }).catch(err => {
                console.error(err);
            });
        });

        // Handle security requests
        global.ipcMain.on('showMasterCert', function(event) {
            let pwsSettings = global.Settings.read();
            const masterCert = require('path').join(pwsSettings.appFolder, 'security', 'ca', 'dev.cc.crt');
            require('electron').shell.showItemInFolder(masterCert);
        });
        global.ipcMain.on('regenCerts', function(event, arg) {
            global.VMS.regenerateCertificates();
            event.sender.send(arg.uuid);
        });
        global.ipcMain.on('showSSHKeys', function(event) {
            let pwsSettings = global.Settings.read();
            const sshKey = require('path').join(pwsSettings.appFolder, 'security', 'ssh', 'pws_rsa.pub');
            require('electron').shell.showItemInFolder(sshKey);
        });
        global.ipcMain.on('regenKeys', function(event, arg) {   
            global.VMS.regenerateSSHKeys();
            event.sender.send(arg.uuid);
        });
    },

    /**
     * unregisterUIEvents - Unregisters all UI events.
     */
    unregisterUIEvents: function() {
        console.log("Destroying uiEvents!!!");
        global.ipcMain.removeAllListeners('checkStatus');
        global.ipcMain.removeAllListeners('openLink');
        global.ipcMain.removeAllListeners('savePass');
        global.ipcMain.removeAllListeners('erase');
        global.ipcMain.removeAllListeners('localhost');
        global.ipcMain.removeAllListeners('terminal');
        global.ipcMain.removeAllListeners('files');
        global.ipcMain.removeAllListeners('restartServer');
        global.ipcMain.removeAllListeners('quit');
        global.ipcMain.removeAllListeners('createSnapshot');
        global.ipcMain.removeAllListeners('restoreSnapshot');
        global.ipcMain.removeAllListeners('showMasterCert');
        global.ipcMain.removeAllListeners('regenCerts');
        global.ipcMain.removeAllListeners('showSSHKeys');
        global.ipcMain.removeAllListeners('regenKeys');
    }
};
module.exports = Window;