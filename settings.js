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
        const key = crypto.createHash('md5').update('devstia-pw').digest('hex');
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
        const key = crypto.createHash('md5').update('devstia-pw').digest('hex');
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
            if (os.platform == 'win32' && interfaceName.startsWith('vEthernet')) {
                continue; // Skip Hyper-V interfaces on Windows
            }
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
        const { platform } = require('os');
        const packageJson = require('./package.json');
        let appData = path.join(app.getPath('userData'));
        if (platform() === 'win32') { // Large files, avoid roaming profile on Windows, user local instead
            appData = path.join(app.getPath('appData'), '..', 'Local', packageJson.name);
        }
        let pwSettings = {
            version: packageJson.version,
            webFolder: path.join(app.getPath('home'), 'Sites'),
            pwPass: 'personalweb',
            vmsMemory: 2,
            vmsCPUs: 2,
            sshPort: 8022,
            cpPort: 8083,
            fsMode: 'None',
            debugMode: false,
            lanIP: this.getDefaultLocalIP(),
            appFolder: path.join(appData, 'app' ),
            vmsFolder: path.join(appData, 'vms' ),
            showTips: true
        };

        // Default to WebDAV on Windows and Samba on Linux/Darwin
        if (platform() === 'win32') {
            pwSettings.fsMode = 'WebDAV';
        }else{
            pwSettings.fsMode = 'Samba';
        }
        
        // Read settings file
        const pwFile = path.join(pwSettings.appFolder, 'settings.json');
        const fs = require('fs');
        if (fs.existsSync(pwFile)) {
            pwSettings = JSON.parse(fs.readFileSync(pwFile));
            pwSettings.pwPass = this.decrypt(pwSettings.pwPass);
        }else{
            this.save(pwSettings); // Save the default settings
        }

        // Always reflect package version
        pwSettings.version = packageJson.version;
        return pwSettings;
    },

    /**
     * save - Saves the settings to the settings file.
     * 
     * @param {Object} pwSettings Application settings.
     */
    save: function(pwSettings) {
        let pwCopy = JSON.parse(JSON.stringify(pwSettings));

        // Ensure the folder exists
        const fs = require('fs');
        if (!fs.existsSync(pwCopy.appFolder)) {
            try {
                fs.mkdirSync(pwCopy.appFolder, { recursive: true });
            } catch (error) {
                console.log("Unable to create application settings folder.");
                console.log(error);
            }
        }
    
        // Save the settings
        pwCopy.pwPass = this.encrypt(pwCopy.pwPass);
        const path = require('path');
        const pwFilePath = path.join(pwCopy.appFolder, 'settings.json');
        fs.writeFileSync(pwFilePath, JSON.stringify(pwCopy, null, 2));
    }
};
module.exports = Settings;