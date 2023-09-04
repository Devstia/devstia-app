/**
 * VMS object determines the state of our virtual machine server.
 */
var VMS = {

    // Properties
    pwsSettings: null,

    // Methods
    /**
     * state - Determines the state of our virtual machine server.
     * @param {object} pwsSettings - The PWS settings object.
     * @returns {string} - The state of our virtual machine server.
     */
    state: function(pwsSettings) {
        this.pwsSettings = pwsSettings;
        let filename = null;
        if (process.arch == 'arm64') filename = 'pws-arm64';
        if (process.arch == 'x64') filename = 'pws-amd64';
        if (filename != null) {
            const path = require('path');
            const fs = require('fs');
            const archiveFile = path.join(pwsSettings.appFolder, 'vms', filename + '.tar.xz');
            const imageFile = path.join(pwsSettings.appFolder, 'vms', filename + '.img');
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