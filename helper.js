/**
 * Virtuosoft - Code Garden PWS (Personal Web Server) Helper
 * 
 * Our elevated/privileged functions that are used to start/stop/restart the server
 */

// Initialize our helper process
let pathAddendum = '';
let pwsSettings = initApplication();

// Start the server
startServer();

// Cleanup
cleanupApplication();

/**
 * cleanupApplication - Cleans up the application on exit or crash.
 */
function cleanupApplication() {
    const fs = require('fs');
    const path = require('path');
    const lockFile = path.join(pwsSettings.appFolder, 'helper.lock');

    // Cleanup lockfile on application exit
    process.on('exit', () => {
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
    });

    // Cleanup lockfile on application crash
    process.on('uncaughtException', () => {
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
    });

    // Cleanup lockfile on application crash
    process.on('unhandledRejection', () => {
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
    });
}

/**
 * getAppDataPath - Returns the path to the application data folder for
 * the current platform; as the helper doesn't have an app object.
 * 
 * @returns {String} Path to the application data folder.
 */
function getAppDataPath() {
    const os = require('os');
    const platform = os.platform();
    const path = require('path');

    if (platform === 'win32') {
        return path.join(process.env.APPDATA);
    }

    if (platform === 'darwin') {
        return path.join(process.env.HOME, 'Library', 'Application Support');
    }

    if (platform === 'linux') {
        return path.join(process.env.HOME, '.config');
    }

    throw new Error('Unsupported platform: ' + platform);
}

/**
 * initApplication - Initializes the helper to obtain the application settings.
 * 
 * @returns {Object} Application settings
 */
function initApplication() {

    // Add Windows runtime binaries to path for tar/ssh/etc functionality on Windows
    if (process.platform === 'win32') {
        const path = require('path');
        pathAddendum = path.join(__dirname, 'runtime', 'win_x64') + ';';
    }

    // Read the current settings
    let pwsSettings = readSettings();

    // Create a lock file to enforce single instance
    const fs = require('fs');
    const path = require('path');
    const lockFile = path.join(pwsSettings.appFolder, 'helper.lock');
    if (fs.existsSync(lockFile)) {
        console.error('Application is already running.');
        process.exit(1);
    } else {
        fs.writeFileSync(lockFile, 'locked');
    }

    // Return the current settings
    return pwsSettings;
}

/**
 * readSettings - Reads and returns settings from the settings file.
 * 
 * @returns {Object} Application settings.
 */
function readSettings() {

    // Read existing settings file
    const packageJson = require('./package.json');
    const appName = packageJson.name;
    const path = require('path');
    const appFolder = path.join(getAppDataPath(), appName);
    const pwsFilePath = path.join(appFolder, 'settings.json');
    const fs = require('fs');
    let pwsSettings = null;
    if (fs.existsSync(pwsFilePath)) {
        pwsSettings = JSON.parse(fs.readFileSync(pwsFilePath));
    }
    if (!pwsSettings) {
        console.error('Unable to read settings file.');
        process.exit(1);
    }
    pwsSettings.appFolder = appFolder;
    return pwsSettings;
}

/** 
 * startServer - Starts the platform and architecture specific server.
 * 
 */
function startServer() {
    const { spawn } = require('child_process');
    const path = require('path');
    const qemuArgs = [
        '-accel', 'hvf',
        '-cpu', 'Haswell-v1',
        '-smp', '3',
        '-m', '4G',
        '-vga', 'virtio',
        '-display', 'default,show-cursor=on',
        '-device', 'virtio-net-pci,netdev=net0',
        '-netdev', 'user,id=net0,hostfwd=tcp::8022-:22,hostfwd=tcp::80-:80,hostfwd=tcp::443-:443,hostfwd=tcp::8083-:8083',
        '-drive', 'if=virtio,format=qcow2,file=pws-amd64.img'
    ];
    const qemuProcess = spawn('qemu-system-x86_64', qemuArgs, {
        cwd: pwsSettings.appFolder
    });

    qemuProcess.stdout.on('data', (data) => {
        console.log(`QEMU stdout: ${data}`);
    });

    qemuProcess.stderr.on('data', (data) => {
        console.error(`QEMU stderr: ${data}`);
    });

    qemuProcess.on('close', (code) => {
        console.log(`QEMU process exited with code ${code}`);
    });

    process.on('SIGINT', () => {
        // Gracefully terminate the QEMU process on SIGINT (e.g., when pressing Ctrl+C)
        qemuProcess.kill('SIGINT');
    });

    // Keep the Node.js process running until the QEMU process is terminated
    qemuProcess.on('exit', () => {
        process.exit();
    });
}