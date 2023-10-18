/**
 * Settings object contains our settings related functions.
 */
var Settings = {

    /**
     * Decrypts data using aes-256-cbc algorithm
     * 
     * @param data string to be decrypted
     * @returns string containing decrypted data
     */
    decrypt: function(data) {
        const crypto = require('crypto');
        const key = crypto.createHash('md5').update('personal-web-server').digest('hex');
        let encryptedText = data.split(':');
        let iv = encryptedText[1];
        iv = Buffer.from(iv, 'base64');
        encryptedText = encryptedText[0];
        encryptedText = Buffer.from(encryptedText, 'base64');

        // Creating Decipher
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);

        // Updating encrypted text
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        // returns data after decryption
        return decrypted.toString();
    },

    /**
     * Encrypts data using aes-256-cbc algorithm
     * 
     * @param data string to be encrypted
     * @returns string containing encrypted data and iv
     */
    encrypt: function(data) {
        const crypto = require('crypto');
        const key = crypto.createHash('md5').update('personal-web-server').digest('hex');
        let iv = crypto.randomBytes(16);
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Returning iv and encrypted data
        return encrypted.toString('base64') + ":" + iv.toString('base64');
    },

    /**
     * getDefaultLocalIP - Gets the default IP address of the host.
     * 
     * @returns {String} Default IP address of the host.
     */
    getDefaultLocalIP: function() {
        const os = require('os');
        const interfaces = os.networkInterfaces();

        for (const interfaceName of Object.keys(interfaces)) {
        const interfaceList = interfaces[interfaceName];
    
        for (const interface of interfaceList) {

            // Skip over non-IPv4 and internal addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
        }  
        return '127.0.0.1';
    },

    /**
     * read - Reads and returns settings from the settings file.
     * 
     * @returns {Object} Application settings.
     */
    read: function() {

        // Default settings
        const app = require('electron').app;
        const path = require('path');
        const packageJson = require('./package.json');
        let pwsSettings = {
            version: packageJson.version,
            webFolder: path.join(app.getPath('home'), 'Sites'),
            pwsPass: 'personal-web-server',
            sshPort: 8022,
            cpPort: 8083,
            fsMode: 'None',
            debugMode: false,
            lanIP: this.getDefaultLocalIP(),
            appFolder: path.join(app.getPath('appData'), packageJson.name, 'app' ),
            vmsFolder: path.join(app.getPath('appData'), packageJson.name, 'vms' ),
        };

        // Default to WebDAV on Windows and Samba on Linux/Darwin
        const { platform } = require('os');
        if (platform() === 'win32') {
            pwsSettings.fsMode = 'WebDAV';
        }else{
            pwsSettings.fsMode = 'Samba';
        }
        
        // Read settings file
        const pwsFile = path.join(pwsSettings.appFolder, 'settings.json');
        const fs = require('fs');
        if (fs.existsSync(pwsFile)) {
            pwsSettings = JSON.parse(fs.readFileSync(pwsFile));
            pwsSettings.pwsPass = this.decrypt(pwsSettings.pwsPass);
        }else{
            this.save(pwsSettings); // Save the default settings
        }
        return pwsSettings;
    },

    /**
     * save - Saves the settings to the settings file.
     * 
     * @param {Object} pwsSettings Application settings.
     */
    save: function(pwsSettings) {
        let pwsCopy = JSON.parse(JSON.stringify(pwsSettings));

        // Ensure the folder exists
        const fs = require('fs');
        if (!fs.existsSync(pwsCopy.appFolder)) {
            try {
                fs.mkdirSync(pwsCopy.appFolder, { recursive: true });
            } catch (error) {
                console.log("Unable to create application settings folder.");
                console.log(error);
            }
        }
    
        // Save the settings
        pwsCopy.pwsPass = this.encrypt(pwsCopy.pwsPass);
        const path = require('path');
        const pwsFilePath = path.join(pwsCopy.appFolder, 'settings.json');
        fs.writeFileSync(pwsFilePath, JSON.stringify(pwsCopy, null, 2));
    },

    /**
     * uiEvents - Handles user interface events from the settings window.
     */
    uiEvents: function() {
        const Window = require('./window.js');
        const VMS = require('./vms.js');
        const ipcMain = require('electron').ipcMain;
        const self = this;

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
                console.error(`Error executing Settings.checkStatus command: ${error}`);
            });
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
            let pwsSettings = self.read();
            if (newSettings.pwsPass != pwsSettings.pwsPass) {
                VMS.updatePassword(newSettings.pwsPass);
                pwsSettings.pwsPass = newSettings.pwsPass;
                self.save(pwsSettings);
                VMS.pwsSettings = pwsSettings;
                event.sender.send(newSettings.uuid);
            }
        });

        // Handle system requests
        ipcMain.on('erase', function(event, arg) {
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
                        Window.executeJavaScript("showWaitingSystem('Erasing server...');document.getElementById('close-button').addClass('disabled');");
                        VMS.erase();
                        setTimeout(function() {
                            Window.executeJavaScript("$('#close-button').addClass('disabled');showWaitingSystem('Re-installing server... Please wait');");
                            VMS.extract(function() {
                                Window.executeJavaScript("$('.badge').css('opacity', '20%');$('#status-waiting').show();hideWaitingSystem();$('#close-button').removeClass('disabled');");
                                VMS.startup(true); // restarted
                            });
                        }, 10000);
                    }else{
                        const dialog = require('electron').dialog;
                        dialog.showErrorBox('CodeGarden - Invalid Input', 'Please type "ERASE" to confirm.');
                    }    
                }
            })
        });
        ipcMain.on('localhost', function(event, arg) {
            event.returnValue = Window.invoke('localhost', arg);
        });
        ipcMain.on('terminal', function(event, arg) {
            event.returnValue = Window.invoke('terminal', arg);
        });
        ipcMain.on('files', function(event, arg) {
            event.returnValue = Window.invoke('files', arg);
        });
        ipcMain.on('restartServer', function(event, arg) {
            VMS.restart(function() {
                event.sender.send(arg.uuid);
            });
        });
        ipcMain.on('quit', function(event, arg) {
            event.returnValue = Window.invoke('quit', arg);
        });

        // Handle security requests
        ipcMain.on('showMasterCert', function(event) {
            let pwsSettings = self.read();
            const masterCert = require('path').join(pwsSettings.appFolder, 'security', 'ca', 'dev.cc.crt');
            require('electron').shell.showItemInFolder(masterCert);
        });
        ipcMain.on('regenCerts', function(event, arg) {
            VMS.regenerateCertificates();
            event.sender.send(arg.uuid);
        });
        ipcMain.on('showSSHKeys', function(event) {
            let pwsSettings = self.read();
            const sshKey = require('path').join(pwsSettings.appFolder, 'security', 'ssh', 'pws_rsa.pub');
            require('electron').shell.showItemInFolder(sshKey);
        });
        ipcMain.on('regenKeys', function(event, arg) {   
            VMS.regenerateSSHKeys();
            event.sender.send(arg.uuid);
        });
    }
};
module.exports = Settings;