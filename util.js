/**
 * Util object provides us with needed utility functions
 */
var Util = {
    // Properties
    appFolder: null,

    // Methods
    allowOneInstance: function() {
        // Allow only one instance of our application
        const fs = require('fs');
        const path = require('path');
        const lockFilePath = path.join(this.appFolder, 'app.lock');
        if (fs.existsSync(lockFilePath)) {
            const lockFileContent = fs.readFileSync(lockFilePath, 'utf8');
            const lockFilePID = parseInt(lockFileContent, 10);
            const { execSync } = require('child_process');
            try {
                const { platform } = require('os');
                if (platform() === 'win32') {
                    const stdout = execSync('tasklist', { encoding: 'utf8' });
                    const lines = stdout.split('\n');
                    const runningPIDs = lines.slice(3).map(line => parseInt(line.substr(28, 5)));
                }else{
                    const stdout = execSync('ps -ax -o pid', { encoding: 'utf8' });
                    const runningPIDs = stdout.trim().split('\n').map(pid => parseInt(pid, 10));
                }

                if (runningPIDs.includes(lockFilePID)) {
                    console.log(`PID ${lockFilePID} exists and is running.`);
                    process.exit();
                } else {
                    console.log(`PID ${lockFilePID} does not exist.`);
                    fs.unlinkSync(lockFilePath);
                }
            } catch (error) {
                console.error(`Error executing command: ${error.message}`);
                process.exit();
            }
        }
        fs.writeFileSync(lockFilePath, process.pid.toString());
        process.on('exit', () => {
            fs.unlinkSync(lockFilePath);
        });
    },
    copyScripts: function() {
        // Copy over our user customizable scripts folder
        const fs = require('fs');
        const path = require('path');
        const scriptsFolder = path.join(this.appFolder, 'scripts');
        if (!fs.existsSync(scriptsFolder)) {

            // Copy over our default scripts
            const defaultScriptsFolder = path.join(__dirname, 'scripts');
            const fse = require('fs-extra');
            try {
                fse.copySync(defaultScriptsFolder, scriptsFolder);
            } catch (err) {
                console.error('Error copying folder:', err);
            }
        }
    },
    uuidv4: function() {
        const crypto = require('crypto');
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
};
module.exports = Util;