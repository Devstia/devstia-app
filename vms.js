/**
 * VMS object determines the state of our virtual machine server.
 */
const Util = require('./util.js');
var VMS = {

    // Properties
    pwsSettings: null,
    filename: null,
    quitting: false,
    listeners: {},

    // Methods
    /**
     * download - Locates the compatible VMS runtime at virtuosoft.com/downloads/cg-pws.
     * @param {function} callback - The callback function to furnish the download progress.
     */
    download: function() {
        var self = this;
        const https = require('https');
        const fs = require('fs');
        const path = require('path');
        const jsonUrl = 'https://virtuosoft.com/downloads/cg-pws';
        const filename = this.filename;
        const archiveFile = path.join(this.pwsSettings.appFolder, 'vms', filename + '.tar.xz');
        const directoryPath = path.dirname(archiveFile);
        if (!fs.existsSync(directoryPath)) {
            try {
                fs.mkdirSync(directoryPath, { recursive: true });
            } catch (error) {
                this.invoke('downloadError', { error: `Error creating directory: ${directoryPath}` + JSON.stringify(error) });
                console.error(`Error creating directory: ${directoryPath}`, error);
            }
        }

        // Fetches the JSON data telling us where to download the VMS runtime
        function fetchJsonData(url) {
            return new Promise((resolve, reject) => {
                function getDownloadURL(url) {
                    https.get(url, (response) => {

                        // Accept redirects
                        if (response.statusCode == 302 || response.statusCode == 301) {
                            getDownloadURL(response.headers.location);
                        }else{
                            let data = '';
                            response.on('data', (chunk) => {
                                data += chunk;
                            });
                            response.on('end', () => {
                                try {
                                    const jsonData = JSON.parse(data);
                                    resolve(jsonData);
                                } catch (error) {
                                    reject(error);
                                }
                            });
                        }
                    }).on('error', (error) => {
                        reject(error);
                    });
                }
                getDownloadURL(jsonUrl);
            });               
        }

        // Download the VMS runtime
        function downloadFile(url, destFile) {
            return new Promise((resolve, reject) => {
                function downloadFromURL(url, destFile) {
                    const fileStream = fs.createWriteStream(destFile);
                    const request = https.get(url, (response) => {

                        // Accept redirects
                        if (response.statusCode == 302 || response.statusCode == 301) {
                            downloadFromURL(response.headers.location, destFile);
                        }else{

                            // Update download progress
                            const totalLength = parseInt(response.headers['content-length'], 10);
                            let downloadedLength = 0;
                            response.on('data', (chunk) => {
                                if (self.quitting == true) {
                                    request.abort();
                                    fileStream.close();
                                }else{
                                    downloadedLength += chunk.length;
                                    const percent = Math.round((downloadedLength / totalLength) * 100);
                                    if (percent >= 99) percent == 99;
                                    self.invoke('downloadProgress', percent);
                                }
                            });
                            response.on('end', () => {
                                self.invoke('downloadProgress', 100);
                                setTimeout(() => {
                                    self.invoke('downloadComplete');
                                }, 1000);
                                resolve(destFile);
                            });
                            response.on('error', (error) => {
                                reject(error);
                            });

                            // Download to the file
                            try {
                                response.pipe(fileStream);
                            }catch(error) {
                                reject(error);
                            }
                        }
                    });
                }
                downloadFromURL(url, destFile);
            });
        }

        // Do the fetching and downloading
        (async function() {
            try {
                const jsonData = await fetchJsonData(jsonUrl);
                if (jsonData.hasOwnProperty(filename)) {

                    // Choose random URL from response list
                    const urls = jsonData[filename];
                    const randomIndex = Math.floor(Math.random() * urls.length);
                    const dlURL = urls[randomIndex];
                    
                    // Download the given file to the appFolder/vms folder
                    const fs = require('fs');
                    if (fs.existsSync(archiveFile + '.download')) {
                        fs.unlinkSync(archiveFile + '.download');
                    }
                    await downloadFile(dlURL, archiveFile + '.download');
                    fs.renameSync(archiveFile + '.download', archiveFile);
                }else{
                    let err = 'No download available for ' + filename + ' platform.';
                    console.error(err);
                    self.invoke('downloadError', { error: err });
                }
            } catch (error) {
                console.error('Error:', error);
                self.invoke('downloadError', { error: JSON.stringify(error) });
            }
        })();
    },
    /**
     * erase - Erases the virtual machine server.
     */
    erase: function() {
        this.shutdown();
        
        // Delete all img files in the VMS folder
        setTimeout(() => {
            const path = require('path');
            const vmsFolder = path.join(this.pwsSettings.appFolder, 'vms');
            const fs = require('fs');
            fs.readdir(vmsFolder, (err, files) => {
                if (err) {
                    console.error('Error reading directory:', err);
                    return;
                }
                files.forEach((file) => {
                    const filePath = path.join(vmsFolder, file);
                    if (fs.statSync(filePath).isFile() && file.endsWith('.img')) {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error('Error deleting file:', err);
                                return;
                            }
                            console.log(`Deleted file: ${filePath}`);
                        });
                    }
                });
            });
        }, 5000);
    },
    /**
     * extract - Extracts the VMS runtime from the downloaded archive.
     * @param {function} callback - The callback function to invoke after extraction completes.
     */
    extract: function() {
        let self = this;
        const path = require('path');
        const filename = this.filename;
        const archiveFile = path.join(self.pwsSettings.appFolder, 'vms', filename + '.tar.xz');
        let pathAddendum = '';
        if (process.platform === 'win32') { // Add runtime binaries to path for tar functionality on Windows
            const path = require('path');
            pathAddendum = path.join(__dirname, 'runtime', 'win_x64') + ';';
        }
        const tarProcess = require('child_process').spawn('tar', ['-xf', path.basename(archiveFile)], {
            cwd: path.dirname(archiveFile),
            env: {
                PATH: pathAddendum + `${process.env.PATH}${path.delimiter}`,
            },
        });
        tarProcess.on('exit', (code) => {
            if (code === 0) {
                self.invoke('extractComplete');
            } else {
                let err = `Archive extraction failed with exit code ${code}`;
                console.error(err);
                self.invoke('extractError', { error: err });
            }
        });
        tarProcess.on('error', (err) => {
            err = `Archive extraction failed: ${err}`;
            console.error(err);
            self.invoke('extractError', { error: err });
        });
    },
    getProcessID: function() {
        const { execSync } = require('child_process');
        try {
            const stdout = execSync('ps -ax | grep "qemu.*file=' + this.filename + '.img" | grep -v grep | awk \'{print $1}\'');
            const processIds = stdout.toString().trim().split('\n');
            if (isNaN(processIds[0]) || processIds == '') return null;
            if (processIds.length == 0) return null;
            return processIds[0];
        } catch (error) {
            console.error(`Error executing command: ${error.message}`);
            return null;
        }
    },
    /**
     * 
     * @param {string} event - the name of the event to invoke.
     * @param {*} message - an optional message to send, if not an object, will be wrapped in an object with a 'value' property.
     */
    invoke: function(event, message = {}) {
        if (typeof message == 'object' && Array.isArray(message) == false) {
        }else{
            message = { value: message, uuid: Util.uuidv4() };
        }
        try {
            if (this.listeners[event] != undefined) {
                this.listeners[event].forEach(listener => {
                    listener(message);
                });
            }
        }catch(error) {
            console.error(`Error invoking listener for ${event}: ${error}`);
        }
    },
    /**
     * on - allows the main process to listen for events our VMS object.
     * @param {string} event - the name of the event to listen for.
     * @param {function} listener - the listener function to invoke when the event is received.
     */
    on: function(event, listener) {
        if (this.listeners[event] == undefined) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    },
    /**
     * regenerateCertificates - Regenerates the certificates for the VMS.
     */
    regenerateCertificates: function() {
        this.sudo( '/usr/local/hestia/bin/v-invoke-plugin cg_pws_regenerate_certificates' );
    },
    /**
     * regenerateSSHKeys - Regenerates the SSH keys for the VMS.
     */
    regenerateSSHKeys: function() {
        this.sudo( '/usr/local/hestia/bin/v-invoke-plugin cg_pws_regenerate_ssh_keys' );
    },
    /**
     * restart - Restarts the virtual machine server.
     * @param {function} callback - The callback function to invoke after restart completes.
     */
    restart: function(cb) {
        this.shutdown();

        // Wait up to 20 seconds for proper shutdown
        let retries = 0;
        let tiShutdown = setInterval(() => {
            if (this.getProcessID() == null) {
                clearInterval(tiShutdown);
                this.startup();
                cb();
            }
            retries++;
            if (retries >= 20) {
                clearInterval(tiShutdown);
                console.log('Error. VMS restart timed out.');
                cb();
            }
        }, 1000);
    },
    /**
     * state - Determines the state of our virtual machine server.
     * @param {object} pwsSettings - The PWS settings object.
     * @returns {string} - The state of our virtual machine server.
     */
    state: function() {
        this.filename = null;
        if (process.arch == 'arm64') this.filename = 'pws-arm64';
        if (process.arch == 'x64') this.filename = 'pws-amd64';
        if (this.filename != null) {
            if (this.getProcessID() != null) {
                return 'running';               // Running
            }
            const path = require('path');
            const fs = require('fs');
            const archiveFile = path.join(this.pwsSettings.appFolder, 'vms', this.filename + '.tar.xz');
            const imageFile = path.join(this.pwsSettings.appFolder, 'vms', this.filename + '.img');
            if (!fs.existsSync(archiveFile)) {
                return 'download';              // Download
            }else{
                if (!fs.existsSync(imageFile)) {
                    return 'extract';           // Extract
                }else{
                    return 'startup';           // Startup
                }
            }
        }else{
            return 'unsupported';               // Unsupported
        }
    },
    /**
     * sudo - Executes a command with root privleges on the VMS.
     * @param {string} cmd - The shell command to execute.
     */
    sudo: function(cmd) {
        const { execSync } = require('child_process');
        let ssh = 'chmod 600 "' + this.pwsSettings.appFolder + '/security/ssh/debian_rsa' + '" && echo "';
        ssh += this.pwsSettings.pwsPass + '" | ssh -q -o StrictHostKeyChecking=no -i "';
        ssh += this.pwsSettings.appFolder + '/security/ssh/debian_rsa" debian@local.dev.cc -p ';
        ssh += this.pwsSettings.sshPort + ' "sudo -S -p ' + "'' " + cmd + '"';
        try {
            const stdout = execSync(ssh, { encoding: 'utf8' });
            return stdout.trim();
        } catch (error) {
            console.error(`Error executing command: ${error.message}`);
            return null;
        }
    },
    /**
     * shutdown - Shuts down the virtual machine server.
     */
    shutdown: function() {
        this.sudo('shutdown now');
    },
    /**
     * startup - Starts the virtual machine server.
     */
    startup: function() {

        // Startup doesn't require sudo, so we can just execute the script
        const self = this;
        let cmd = '"' + this.pwsSettings.appFolder + '/scripts/startup.sh" ' + this.pwsSettings.sshPort;
        cmd += ' ' + this.pwsSettings.cpPort + ' "' + this.pwsSettings.appFolder + '"';
        console.log(cmd);
        const { exec } = require('child_process');
        const child = exec(cmd, { detached: true }, (error, stdout, stderr) => {
            if (error) {
                let err = `Error executing command: ${error.message}`;
                console.error(err);
                self.invoke('startupError', { error: err });
            }
        });
        child.unref();
        let started = false;
        for (let i = 0; i < 10; i++) {
            if (this.getProcessID() != null) {
                started = true;
                break;
            }else{
                require('deasync').sleep(1000);
            }
        }
        if (started == true) {
            self.invoke('startupComplete');
        }else{
            let err = 'Starting VMS timed out.';
            console.error(err);
            self.invoke('startupError', { error: err });
        }
    },
    /**
     * updatePassword - Updates the passwords in the VMS for debian, admin, pws, Samba, and WebDAV.
     * @param {string} password - The new password to use.
     */
    updatePassword: function(password) {
        const shellEscape = require('shell-escape');
        const escapedPassword = shellEscape([password]);
        this.sudo('/usr/local/hestia/plugins/cg-pws/update-password.sh ' + escapedPassword);
    },
    /**
     * updateCPPort - Updates the Control Panel port in the VMS.
     * @param {number} port - The new port number.
     */
    updateCPPort: function(port) {
        const shellEscape = require('shell-escape');
        this.sudo('/usr/local/hestia/plugins/cg-pws/update-cp-port.sh ' + port.toString());
    }
};
module.exports = VMS;