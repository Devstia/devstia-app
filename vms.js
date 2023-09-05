/**
 * VMS object determines the state of our virtual machine server.
 */
var VMS = {

    // Properties
    pwsSettings: null,
    filename: null,
    quitting: false,

    // Methods
    /**
     * download - Locates the compatible VMS runtime at virtuosoft.com/downloads/cg-pws.
     * @param {function} callback - The callback function to furnish the download progress.
     */
    download: function(callback) {
        const https = require('https');
        const fs = require('fs');
        const path = require('path');
        const { promisify } = require('util');
        const readFileAsync = promisify(fs.readFile);
        const writeFileAsync = promisify(fs.writeFile);
        const jsonUrl = 'https://virtuosoft.com/downloads/cg-pws';
        const filename = this.filename;
        const archiveFile = path.join(this.pwsSettings.appFolder, 'vms', filename + '.tar.xz');
        const directoryPath = path.dirname(archiveFile);
        if (!fs.existsSync(directoryPath)) {
            try {
                fs.mkdirSync(directoryPath, { recursive: true });
            } catch (error) {
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
                                if (this.quitting == true) {
                                    request.abort();
                                    fileStream.close();
                                } 
                                downloadedLength += chunk.length;
                                const percent = Math.round((downloadedLength / totalLength) * 100);
                                if (percent => 99) percent == 99;
                                callback(percent);
                            });
        
                            // Download to file
                            response.pipe(fileStream);
                            response.on('end', () => {
                                callback(100);
                                resolve(destFile);
                            });
                            response.on('error', (error) => {
                                reject(error);
                            });
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
                    console.log('No download available for ' + filename + ' platform.');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        })();
    },
    /**
     * state - Determines the state of our virtual machine server.
     * @param {object} pwsSettings - The PWS settings object.
     * @returns {string} - The state of our virtual machine server.
     */
    state: function(pwsSettings) {
        this.pwsSettings = pwsSettings;
        this.filename = null;
        if (process.arch == 'arm64') this.filename = 'pws-arm64';
        if (process.arch == 'x64') this.filename = 'pws-amd64';
        if (this.filename != null) {
            const path = require('path');
            const fs = require('fs');
            const archiveFile = path.join(pwsSettings.appFolder, 'vms', this.filename + '.tar.xz');
            const imageFile = path.join(pwsSettings.appFolder, 'vms', this.filename + '.img');
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
    }
};
module.exports = VMS;