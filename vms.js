/**
 * VMS object determines the state of our virtual machine server.
 */
const Util = global.Util;
const Settings = global.Settings;
var VMS = {

    // Properties
    receivedInitSecurity: false,
    securityServer: null,
    pwSettings: null,
    filename: null,
    quitting: false,
    listeners: {},

    // Methods
    /**
     * checkStatus - Checks the status of the virtual machine server.
     * @returns {object} - Promise with server stats.
     */
    checkStatus: function() {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            const scriptsFolder = require('path').join(this.pwSettings.appFolder, 'scripts');
            let cmd = '';
            let ssh = null;
            if (process.platform === 'win32') {
                let cmd = `cd ${scriptsFolder.replace(/ /g, '\\ ')} && status.bat ${this.pwSettings.sshPort}`;
                console.log(cmd);
                ssh = spawn('cmd', ['/C', cmd]);
            }else{
                cmd = `cd "${scriptsFolder}" && ./status.sh ${this.pwSettings.sshPort}`;
                ssh = spawn('bash', ['-c', cmd]);
            }            
            let output = '';
            ssh.stdout.on('data', (data) => {
                output += data.toString();
            });
            ssh.stderr.on('data', (data) => {
                console.error(`Error: ${data.toString()}`);
            });
            ssh.on('close', (code) => {
                if (code === 0) {
                    resolve(output.trim());
                } else {
                    reject(`Command failed with code ${code}`);
                }
            });
            ssh.stdin.end();
        });
    },
    /**
     * download - Locates the compatible VMS runtime at virtuosoft.com/downloads/devstia-vm.
     * @param {function} callback - The callback function to furnish the   progress.
     */
    download: function() {
        var self = this;
        const https = require('https');
        const fs = require('fs');
        const path = require('path');
        const jsonUrl = 'https://virtuosoft.com/downloads/dev-pw';
        const filename = this.filename;
        const archiveFile = path.join(this.pwSettings.vmsFolder, filename + '.tar.xz');
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

        // const axios = require('axios');
        // function downloadFile(url, destFile) {
        //     return new Promise((resolve, reject) => {
        //         const writer = fs.createWriteStream(destFile);
        //         let downloadedLength = 0;
        
        //         axios({
        //             method: 'get',
        //             url: url,
        //             responseType: 'stream'
        //         }).then(response => {
        //             const totalLength = response.headers['content-length'];
        
        //             response.data.on('data', (chunk) => {
        //                 downloadedLength += chunk.length;
        //                 const percent = Math.round((downloadedLength / totalLength) * 100);
        //                 if (self.quitting == true) {
        //                     writer.close();

        //                     // Show electron ok dialog
        //                     const { dialog } = require('electron');
        //                     dialog.showMessageBoxSync({
        //                         type: 'error',
        //                         title: 'Error',
        //                         message: 'Error downloading file: ' + error.message,
        //                         buttons: ['OK']
        //                     });
        //                     process.exit(1);
        //                 } else {
        //                     if (percent >= 99) percent = 99;
        //                     self.invoke('downloadProgress', percent);
        //                 }
        //             });
        
        //             response.data.on('end', () => {
        //                 self.invoke('downloadProgress', 100);
        //                 setTimeout(() => {
        //                     self.invoke('downloadComplete');
        //                 }, 1000);
        //                 resolve(destFile);
        //             });
        
        //             response.data.on('error', (error) => {
        //                 reject(error);
        //             });
        
        //             response.data.pipe(writer);
        
        //         }).catch(error => {
        //             // Show electron ok dialog
        //             const { dialog } = require('electron');
        //             dialog.showMessageBoxSync({
        //                 type: 'error',
        //                 title: 'Error',
        //                 message: 'Error downloading file: ' + error.message,
        //                 buttons: ['OK']
        //             });
        //             process.exit(1);
        //         });
        //     });
        // }
        

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
                            let forceExit = false;
                            response.on('data', (chunk) => {
                                if (forceExit == true) return;
                                if (self.quitting == true) {

                                    // Show electron ok dialog
                                    forceExit = true;
                                    const { dialog } = require('electron');
                                    dialog.showMessageBoxSync({
                                        type: 'error',
                                        title: 'Devstia Preview - Download Error',
                                        message: 'File download aborted. Please try again.',
                                        buttons: ['OK']
                                    });
                                    response.destroy();
                                    process.exit(1);
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
                    console.log('Downloading from: ' + dlURL);
                    
                    // Download the given file to the vmsFolder
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
     * @param {function} callback - The optional callback function to invoke after erase completes.
     */
    erase: function(fDone = null) {
        const self = this;
        this.shutdown(function() {
            const path = require('path');
            const fs = require('fs');
            let pwFile = process.arch == 'arm64' ? 'devstia-arm64.img' : 'devstia-amd64.img';

            pwFile = path.join(self.pwSettings.vmsFolder, pwFile);
            if (fs.existsSync(pwFile)) {
                fs.unlinkSync(pwFile);
                console.log(`Deleted file: ${pwFile}`);
                if (fDone != null) setTimeout(() => { fDone(); }, 1000);
            }
        });
    },
    /**
     * restore - Restores the virtual machine server from a given img file.
     * @param {string} imgFile - The path to the img file to restore.
     * @param {function} callback - The optional callback function to invoke after restore completes.
     */
    restore: function(imgFile, fDone = null) {
        const path = require('path');
        const fs = require('fs');
        const pwFile = process.arch == 'arm64' ? 'devstia-arm64.img' : 'devstia-amd64.img';

        // Copy the file to the VMS folder
        const vmsFilePath = path.join(this.pwSettings.vmsFolder, pwFile);
        fs.copyFileSync(imgFile, vmsFilePath);
        if (fDone != null) setTimeout(() => { fDone(); }, 1000);
    },
    /**
     * extract - Extracts the VMS runtime from the downloaded archive.
     * @param {function} callback - Optional callback function to invoke after extraction completes.
     */
    extract: function(fComplete = null) {
        let self = this;
        const fs = require('fs');
        const path = require('path');
        const filename = this.filename;
        const archiveFile = path.join(self.pwSettings.vmsFolder, filename + '.tar.xz');
        const imageFileSizeGuess = fs.statSync(archiveFile).size * 4;
        const imageFile = path.join(self.pwSettings.vmsFolder, filename + '.img');
        let pathAddendum = '';
        if (process.platform === 'win32') { // Add runtime binaries to path for tar functionality on Windows
            pathAddendum = path.join(__dirname, 'runtime', 'win32_x64', 'bin') + ';';
        }
        const tarProcess = require('child_process').spawn('tar', ['-xf', path.basename(archiveFile)], {
            cwd: path.dirname(archiveFile),
            env: {
                PATH: pathAddendum + `${process.env.PATH}${path.delimiter}`,
            },
        });
        let checkImageSize = setInterval(() => {
            try {
                const imageFileSize = fs.statSync(imageFile).size;
                let percent = Math.round((imageFileSize / imageFileSizeGuess) * 100);
                if (percent >= 100) percent = 100;
                self.invoke('extractProgress', percent);
            }catch(error) {
                console.error(`Error checking image file size: ${error}`);
            }
        }, 3000 );
        tarProcess.on('exit', (code) => {
            clearInterval(checkImageSize);
            if (code === 0) {
                self.invoke('extractComplete');
                if (fComplete != null) fComplete();
            } else {
                let err = `Archive extraction failed with exit code ${code}`;
                console.error(err);
                self.invoke('extractError', { error: err });
                if (fs.existsSync(archiveFile)) {
                    fs.unlinkSync(archiveFile);
                }
            }
        });
        tarProcess.on('error', (err) => {
            clearInterval(checkImageSize);
            err = `Archive extraction failed: ${err}`;
            console.error(err);
            self.invoke('extractError', { error: err });
            if (fs.existsSync(archiveFile)) {
                fs.unlinkSync(archiveFile);
            }
        });
    },
    /**
     * getProcessID - Gets the process ID of the VMS server running under QEMU.
     * @returns {number} - The process ID of the VMS server.
     */
    getProcessID: function() {
        const { execSync } = require('child_process');
        try {
            if (process.platform === 'win32') {
                const stdout = execSync('wmic process get ProcessId,CommandLine | findstr ' + this.filename + '.img | findstr qemu-system');
                const processIds = stdout.toString().trim().split('\n');
                const filteredIds = processIds.filter(str => !str.includes('findstr')).map(str => parseInt(str.trim().slice(-25)));
                if (isNaN(filteredIds[0]) || filteredIds == '') return null;
                if (filteredIds.length == 0) return null;
                return filteredIds[0];
            }else{
                const stdout = execSync('ps -ax | grep "qemu.*file=' + this.filename + '.img" | grep -v grep | awk \'{print $1}\'');
                const processIds = stdout.toString().trim().split('\n');
                if (isNaN(processIds[0]) || processIds == '') return null;
                if (processIds.length == 0) return null;
                return processIds[0];
            }
        } catch (error) {
            console.error(`Error executing VMS.getProcessID command: ${error.message}`);
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
        this.sudo( '/usr/local/hestia/bin/v-invoke-plugin dev_pw_regenerate_certificates' );
    },
    /**
     * regenerateSSHKeys - Regenerates the SSH keys for the VMS.
     */
    regenerateSSHKeys: function() {
        this.sudo( '/usr/local/hestia/bin/v-invoke-plugin dev_pw_regenerate_ssh_keys' );
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
                this.startup(true);
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
     * @param {object} pwSettings - The PW settings object.
     * @returns {string} - The state of our virtual machine server.
     */
    state: function() {
        this.filename = null;
        if (process.arch == 'arm64') this.filename = 'devstia-arm64';
        if (process.arch == 'x64') this.filename = 'devstia-amd64';
        if (this.filename != null) {
            if (this.getProcessID() != null) {
                return 'running';               // Running
            }
            const path = require('path');
            const fs = require('fs');
            const archiveFile = path.join(this.pwSettings.vmsFolder, this.filename + '.tar.xz');
            const imageFile = path.join(this.pwSettings.vmsFolder, this.filename + '.img');
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
     * sudo - Executes a command with root privleges on the remote VMS.
     * @param {string} cmd - The shell command to execute.
     */
    sudo: function(cmd) {
        const { execSync } = require('child_process');
        let sudo = null;
        if (process.platform === 'win32') {
            sudo = 'sudo.bat';
            cmd = cmd.replace(/\^/g, '^^').replace(/&/g, '^&').replace(/</g, '^<').replace(/>/g, '^>').replace(/\|/g, '^|');
        }else{
            sudo = './sudo.sh';
        }
        const scriptsFolder = require('path').join(this.pwSettings.appFolder, 'scripts');
        let ssh = `cd "${scriptsFolder}" && ${sudo} ${this.pwSettings.sshPort}`;
        ssh += ` "${this.pwSettings.pwPass}" "${cmd}"`;
        let stdout = null;
        try {
            stdout = execSync(ssh, { encoding: 'utf8' });
            return stdout.trim();
        } catch (error) {
            console.error(`Error executing VMS.sudo command: ${error.message}`);
            return null;
        }
    },
    /**
     * shutdown - Shuts down the virtual machine server and rclone.
     * @param {function} callback - The optional callback function to invoke after shutdown completes.
     */
    shutdown: function(fDone = null) {
        this.sudo("shutdown now");

        // Wait up to 20 seconds for qemu to shutdown
        const execSync = require('child_process').execSync;
        let pid = null;
        for (let i = 0; i < 20; i++) {
            pid = this.getProcessID();
            if ( pid == null) {
                break;
            }else{
                const { execSync } = require('child_process');
                if (process.platform === 'win32') { 
                    execSync('ping 127.0.0.1 -n 2 > nul');
                }else{
                    execSync('sleep 1');
                }
            }
        }
        if (pid != null) {
            // Kill the process by pid
            console.log("QEMU shutdown failed. Killing process: " + pid);
            if (process.platform === 'win32') {
                execSync('taskkill /F /PID ' + pid);
            }else{
                execSync('kill -9 ' + pid);
            }
        }

        // Kill the rclone process
        if (this.securityServer != null) {
            this.securityServer.close();
            this.securityServer = null;
        }
        if (fDone != null) setTimeout(() => { fDone(); }, 1000);
    },
    /**
     * startup - Starts the virtual machine server.
     */
    startup: function(restarted = false) {
        // Add runtime binaries to path for the given platform
        const self = this;
        const path = require('path');
        const runtimePath = path.join(__dirname, 'runtime', process.platform + '_' +  process.arch, 'bin')
                            + path.delimiter + `${process.env.PATH}${path.delimiter}`;
                  
        // Create app security folders
        const fs = require('fs');
        const securityFolder = path.join(self.pwSettings.appFolder, 'security');
        if (!fs.existsSync(path.join(securityFolder, 'ca'))) {
            fs.mkdirSync(path.join(securityFolder, 'ca'), { recursive: true });
        }
        if (!fs.existsSync(path.join(securityFolder, 'ssh'))) {
            fs.mkdirSync(path.join(securityFolder, 'ssh'), { recursive: true });
        }

        // Allowed security server cert and key files to obtain from the VMS
        const allowedFilenames = ['pwPass','ca/dev.pw.crt','ca/dev.pw.key','ssh/debian_rsa','ssh/debian_rsa.pub',
            'ssh/devstia_rsa','ssh/devstia_rsa.pub','ssh/ssh_host_ecdsa_key.pub','ssh/ssh_host_rsa_key.pub'];

        // Start the security server
        if (this.securityServer == null) {
            const http = require('http');
            this.securityServer = http.createServer((req, res) => {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', (chunk) => {
                        body += chunk;
                    });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);

                            // Pop up settings window
                            if (data.hasOwnProperty('showSettings')) {
                                if (data.showSettings == true) {
                                    self.invoke('showSettings');
                                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                                    res.end('OK');
                                    return;                                    
                                }
                            }
                            for (const [filename, content] of Object.entries(data)) {
                                if (!allowedFilenames.includes(filename)) {
                                    continue;
                                }
                                if (filename == 'pwPass') {
                                    self.pwSettings.pwPass = Settings.decrypt(content);
                                    Settings.save(self.pwSettings);
                                    continue;
                                }
                                const filePath = path.join(securityFolder, filename);
                                fs.writeFile(filePath, content, (err) => {
                                    if (err) {
                                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                                        res.end('Internal Server Error');
                                    } else {
                                        fs.chmod(filePath, 0o600, (err) => {
                                            if (err) {
                                                console.error(`Error setting file mode: ${err}`);
                                            }
                                        });
                                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                                        res.end('OK');
                                        if (filename == 'ssh/devstia_rsa') {
                                            self.invoke('certsKeysPublished');
                                        }
                                    }
                                });
                            }
                        }catch(error) {
                            console.error(`Error parsing JSON data: ${error}`);
                            res.writeHead(500, {'Content-Type': 'text/plain'});
                            res.end('Internal Server Error');
                        }
                    });
                }else{
                    res.writeHead(401, {'Content-Type': 'text/plain'});
                    res.end('Unauthorized');
                }
            });
            this.securityServer.on('error', (err) => {
                console.error(`Error starting security server: ${err}`);
            });
            this.securityServer.listen(8088, '127.0.0.1');
        }

        // Startup doesn't require sudo, so we can just execute the script
        let startup = 'startup.sh';
        if (process.platform === 'win32') {
            startup = 'startup.bat';
        }
        const startupScript = path.join(this.pwSettings.appFolder, 'scripts', startup);
        let cmd = '"' + startupScript + '" ' + this.pwSettings.sshPort;
        cmd += ' ' + this.pwSettings.cpPort + ' "' + this.pwSettings.vmsFolder + '"';
        if (this.pwSettings.fsMode.toLowerCase() == 'samba') {
            cmd += ' ",hostfwd=tcp::445-:445"';
        }else{
            cmd += ' ""';
        }
        console.log(cmd);
        const { exec } = require('child_process');
        var exec_error = "";
        const child = exec(cmd, { env: { PATH: runtimePath }, detached: true }, (error, stdout, stderr) => {
            if (error) {
                exec_error = error.message;
                console.error(exec_error);

                // Automatically turn off Samba if host forward error detected
                if (exec_error.indexOf("Could not set up host forwarding rule 'tcp::445-:445'") > -1) {
                    let pwSettings = Settings.read();
                    pwSettings.fsMode = 'None';
                    Settings.save(pwSettings);
                }
            }else{
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
            }
            child.unref();
        });

        // Wait up to 20 seconds for the VMS to start
        let started = false;
        for (let i = 0; i < 20; i++) {
            if (this.getProcessID() != null) {
                started = true;
                break;
            }else{
                const { execSync } = require('child_process');
                if (process.platform === 'win32') { 
                    execSync('ping 127.0.0.1 -n 2 > nul');
                }else{
                    execSync('sleep 1');
                }
            }
            if (exec_error != "") {
                break;
            }
        }
        if (started == true) {
            self.invoke('startupComplete', restarted);
        }else{
            if (exec_error == "") exec_error = 'Starting VMS timed out.';
            console.error(exec_error);
            self.invoke('startupError', { error: exec_error });
        }
    },
    /**
     * updatePassword - Updates the passwords in the VMS for debian, admin, devstia, Samba, and WebDAV.
     * @param {string} password - The new password to use.
     */
    updatePassword: function(password) {
        const shellEscape = require('shell-escape');
        const escapedPassword = shellEscape([password]);
        this.sudo('/usr/local/hestia/plugins/dev-pw/update-password.sh ' + escapedPassword);
    }
};
module.exports = VMS;