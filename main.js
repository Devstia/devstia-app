/**
 * Virtuosoft - Code Garden PWS (Personal Web Server)
 * 
 * Provides a desktop application for managing CODE (Core Open Developer Elements)
 */

// Initialize our application
const app = require('electron').app;
let pathAddendum = '';
let pwsSettings = initApplication();
cleanupApplication();

// checkRuntimeArchive promise return values
const DOWNLOAD_ARCHIVE = 0;
const QUIT_APPLICATION = 1;
const EXTRACT_ARCHIVE = 2;
const START_RUNTIME = 3;

// Begin our application
app.on('ready', () => {
    (async () => {
        const pwsFile = await checkHostCompatibility(); // pws-arm64 or pws-amd64
        const archiveURL = 'https://www.code.gdn/downloads/' + pwsFile + '.tar.xz';

        // Check for downloaded platform runtime, download and extract it if need be
        const path = require('path');
        const archiveFile = path.join(pwsSettings.appFolder, pwsFile + '.tar.xz');
        switch(await checkRuntimeArchive(archiveFile)) {
            case DOWNLOAD_ARCHIVE:
                console.log('Downloading archive file: ' + archiveURL)
                await downloadFile('https://www.code.gdn/downloads/' + pwsFile + '.tar.xz', archiveFile);
                await extractFile(archiveFile);
                break;
            case QUIT_APPLICATION:
                app.quit();
                break;
            case EXTRACT_ARCHIVE:
                await extractFile(archiveFile);
                break;
            case START_RUNTIME:
            default:
        }
        
        // Create our settings API
        createSetttingsAPI();

        // Copy over our user customizable scripts folder
        const fs = require('fs');
        const scriptsFolder = path.join(pwsSettings.appFolder, 'scripts');
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

        // Create our tray app icon
        await createTrayAppIcon();

        // Start services
        await startHelper();

    })().catch( (error) => {
        console.error(`Error occurred: ${error}`);
        process.exit(1);
    });
});

// Keep application alive when settings is closed
app.on('window-all-closed', () => {});

/**
 * cleanupApplication - Cleans up the application on exit or crash.
 */
function cleanupApplication() {
    const fs = require('fs');
    const path = require('path');
    const lockFile = path.join(pwsSettings.appFolder, 'main.lock');

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
 * createSetttingsAPI - Creates the settings API for the renderer process.
 * 
 */
function createSetttingsAPI() {
    const ipcMain = require('electron').ipcMain;

    // Handle request for getSetting from renderer process
    ipcMain.on('getSetting', (event, arg) => {
        pwsSettings = readSettings();
        arg.method = 'reply_getSetting';
        arg.value = pwsSettings[arg.name];
        event.sender.send(arg.uuid, arg);
    });

    // Handle request for setSetting from renderer process
    ipcMain.on('setSetting', (event, arg) => {
        pwsSettings[arg.name] = arg.value;
    });

    // Handle request for invokeEvent from renderer process
    ipcMain.on('invokeEvent', (event, arg) => {
        const dialog = require('electron').dialog;
        const fs = require('fs');
        switch (arg.name) {

            // Used to erase and reset the system
            case 'eraseResetSystem':
                const prompt = require('electron-prompt');
                prompt({
                    title: 'Prompt example',
                    label: '<div style="font-size:smaller;"><span style="font-weight: bold;">WARNING:</span> This will destroy all sites and reset the server installation. <br>Please type "ERASE" to confirm.</div>',
                    value: '',
                    inputAttrs: {
                        type: 'text'
                    },
                    type: 'input',
                    useHtmlLabel: true,
                    width: 480,
                    height: 210
                })
                .then((r) => {
                    if(r === null) {
                        console.log('user cancelled');
                    } else {
                        if (r === 'ERASE') {

                            const dialog = require('electron').dialog;
                            const nativeImage = require('electron').nativeImage;
                            if (process.platform === 'darwin') {
                                app.dock.show();
                            }
                            dialog.showMessageBoxSync({
                                type: 'info',
                                message: "Code Garden will now erase sites, reset settings and quit. Please restart Code Garden to begin anew.",
                                title: 'Code Garden - Reset System',
                                icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
                            });
                            const fs = require('fs');
                            if (fs.existsSync(pwsSettings.appFolder + '/helper.lock')) {
                                stopHelper();
                            }
                            
                            // Delete all img files in the app folder
                            const path = require('path');                                    
                            fs.readdir(pwsSettings.appFolder, (err, files) => {
                                if (err) {
                                console.error('Error reading directory:', err);
                                return;
                                }
                                files.forEach((file) => {
                                    const filePath = path.join(pwsSettings.appFolder, file);
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

                            // Delete settings file
                            fs.unlinkSync(path.join(pwsSettings.appFolder, 'settings.json'));
                            if (process.platform === 'darwin') {
                                app.dock.hide();
                            }
                            app.quit();
                        }
                    }
                })
                .catch(console.error);
                break;

            // Used by Browse button for websites folder
            case 'selectWebFolder':
                dialog.showOpenDialog({
                    properties: ['openDirectory']
                }).then(result => {
                    if (!result.canceled && result.filePaths.length > 0) {
                        arg.method = 'reply_invokeEvent';
                        arg.value = result.filePaths[0];
                        event.sender.send(arg.uuid, arg);
                    }
                });
                break;

            // Used by Save button for saving settings
            case 'saveSettings':
                saveSettings(pwsSettings);
                break;

            // Open link in default browser
            case 'openLink':
                require('electron').shell.openExternal(arg.options);
                break;

            // Get local IP address
            case 'getDefaultLocalIP':
                arg.method = 'reply_getDefaultLocalIP';
                arg.value = getDefaultLocalIP();;
                event.sender.send(arg.uuid, arg);
                break;
            
            // Stop services
            case 'stopServices':
                stopHelper();
                break;

            // Check status
            case 'checkStatus':
                arg.method = 'reply_checkStatus';
                arg.value = getStatus();
                event.sender.send(arg.uuid, arg);
                break;
            
            // Restart services
            case 'restartServices':
                restartHelper();
                break;
        }
    });
}

/**
 * createTrayAppIcon - Creates the tray icon application.
 * 
 */
function createTrayAppIcon() { 
    return new Promise((resolve, reject) => {
        let win;
        const Menu = require('electron').Menu;
        const nativeImage = require('electron').nativeImage;
        const dialog = require('electron').dialog;
        const shell = require('electron').shell;
        const menu = Menu.buildFromTemplate([
            {
                label: 'My Websites (localhost)',
                click: () => shell.openExternal('http://localhost')
            },
            {
                label: 'Terminal',
                click: () => {
                    const { spawn } = require('child_process');
                    const path = require('path');
                    const scriptTerminal = path.join(pwsSettings.appFolder, 'scripts', 'terminal.sh');
                    console.log(scriptTerminal);
                    const p = spawn(scriptTerminal, [pwsSettings.pwsPass, pwsSettings.sshPort.toString()], {
                        cwd: path.dirname(scriptTerminal),
                        detached: true,
                        stdio: 'ignore'
                    });
                    console.log( 'Process started' );
                    console.log(p);
                }
            },
            {
                label: 'Files',
                click: () => {}
            },
            {
                type: 'separator'
            },
            {
                label: 'Settings',
                click: () => {

                    // Create new or display existing window
                    if (win) {
                        win.show();
                    } else {
                        const BrowserWindow = require('electron').BrowserWindow;
                        const path = require('path');
                        let winOptions = {
                            width: 600,
                            height: 480,
                            modal: true,
                            title: 'Code Garden - Settings',
                            maximizable: false,
                            minimizable: false,
                            resizable: false,
                            show: false,
                            icon: './images/cg.png',
                            webPreferences: {
                                preload: path.join(__dirname, 'preload.js'),
                                devTools: false
                            }
                        };

                        // Enable dev tools in debug mode
                        if (pwsSettings.debugMode) {
                            winOptions.webPreferences.devTools = true;
                            winOptions.resizable = true;
                            winOptions.width = 1024;
                        }
                        win = new BrowserWindow(winOptions);

                        // Load the window content
                        win.loadFile('web/settings.html');
                        win.webContents.on('did-finish-load', () => {

                            // Set initial theme mode (light/dark)
                            const nativeTheme = require('electron').nativeTheme;
                            if (nativeTheme.shouldUseDarkColors) {
                                win.webContents.executeJavaScript("setThemeMode('dark');");
                            } else {
                                win.webContents.executeJavaScript("setThemeMode('light');");
                            }

                            // Dynamically update the light/dark theme on OS settings change
                            nativeTheme.on('updated', () => {
                                if (nativeTheme.shouldUseDarkColors) {
                                    win.webContents.executeJavaScript("setThemeMode('dark');");
                                } else {
                                    win.webContents.executeJavaScript("setThemeMode('light');");
                                }
                            });

                            win.show();
                            win.webContents.openDevTools();
                        });
                        win.on('closed', () => {
                            // reset the window variable when it's closed
                            win = null;
                        });
                    }
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                click: () => {
                    const fs = require('fs');
                    if (fs.existsSync(pwsSettings.appFolder + '/helper.lock')) {

                        // Prompt to stop all services before quitting
                        if (process.platform === 'darwin') {
                            app.dock.show();
                        }
                        dialog.showMessageBox({
                            type: 'question',
                            buttons: ['Yes', 'No'],
                            defaultId: 1,
                            message: 'Stop all background services before quitting?',
                            title: 'Code Garden - Quit Application',
                            icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
                        }).then((response) => {
                            if (process.platform === 'darwin') {
                                app.dock.hide();
                            }
                            if (response.response === 0) {
                                stopHelper();
                                app.quit();
                            } else {
                                app.quit();
                            }
                        });
                    }else{
                        app.quit();
                    }
                }
            }
        ]);

        // Create the tray icon
        let icon = nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
        icon = icon.resize({
            height: 16,
            width: 16
        });
        const Tray = require('electron').Tray;
        const tray = new Tray(icon);

        // Apply the menus to our tray
        tray.setContextMenu(menu);
        resolve();
    });
}

/**
 * checkHostCompatibility - Checks the compatibilty of the host OS;
 * displays error message dialog to the user if it is not supported.
 * 
 * @returns {Promise} Promise object represents the platform runtime file name.
 */
function checkHostCompatibility() {
    return new Promise((resolve, reject) => {
        let prFile = null;
        if (process.arch == 'arm64') prFile = 'pws-arm64';
        if (process.arch == 'x64') prFile = 'pws-amd64';
        if (prFile == null) {
            const dialog = require('electron').dialog;
            const nativeImage = require('electron').nativeImage;
            if (process.platform === 'darwin') {
                app.dock.show();
            }
            dialog.showMessageBoxSync({
                type: 'warning',
                message: 'Unsupported platform; the application will now quit.',
                title: 'Code Garden - Unsupported Platform',
                icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
            });
            if (process.platform === 'darwin') {
                app.dock.hide();
            }
            reject('Unsupported platform');
        } else {
            resolve(prFile);
        }
    });
}

/**
 * checkRuntimeArchive - Checks for the existence of the runtime archive file
 * and prompts the user to download it if it does not exist.
 * 
 * @returns {Promise} Promise object with flag indicating DOWNLOAD_ARCHIVE, 
 * QUIT_APPLICATION, EXTRACT_ARCHIVE, START_RUNTIME
 */
function checkRuntimeArchive(archiveFile) {
    return new Promise((resolve, reject) => {

        // Check for downloaded platform archive file
        try {
            const fs = require('fs');
            if (!fs.existsSync(archiveFile)) {
    
                // Prompt user to download platform runtime or quit
                const dialog = require('electron').dialog;
                const nativeImage = require('electron').nativeImage;
                if (process.platform === 'darwin') {
                    app.dock.show();
                }
                const r = dialog.showMessageBoxSync({
                    type: 'question',
                    buttons: ['Download', 'Quit'],
                    defaultId: 1,
                    message: 'A runtime file for your ' + process.arch + ' based processor is required. Download it now (approx. 1.8gb)?',
                    title: 'Code Garden - Download',
                    icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
                });
                if (process.platform === 'darwin') {
                    app.dock.hide();
                }
                resolve(r);
            }else{

                // Check for missing .img files
                const path = require('path');
                fs.readdir(path.dirname(archiveFile), (error, files) => {
                    if (error) {
                        console.error(`Error reading folder: ${error}`);
                        reject(`Error reading folder: ${error}`);
                        return;
                    }
                
                    // Check if the VM image file is present (.img of the same name as the archive)
                    const vmFile = path.basename(archiveFile.replace('.tar.xz', '.img'));
                    const hasVM = files.includes(vmFile);
                    if (hasVM) {
                        resolve(START_RUNTIME);
                    } else {
                        resolve(EXTRACT_ARCHIVE);                        
                    }
                });
            }
        } catch(error) {
            console.log(error);
            reject(error);
        }
    });
}

/**
 * downloadFile - Downloads a file from a URL to a given local file while
 * displaying a progress bar.
 * 
 * @param {String} url URL to download file from.
 * @param {String} localFile Local file to download to.
 * @returns {Promise} Promise object represents the download status.
 */
function downloadFile(url, localFile) {
    return new Promise((resolve, reject) => {
        const download = require('./download.js');
        const ProgressBar = require('electron-progressbar');
        const progressBar = new ProgressBar({
            indeterminate: false,
            closeOnComplete: false,
            title: 'Code Garden - Downloading',
            text: 'Please wait. Downloading...',
            style: {
                bar: {
                    "background-color": "#054b1d"
                },
                value: {
                    "background-color": "#89c23f"
                }
            },
            browserWindow: {
                icon: './images/cg.png'
            }
        });
        download(url, localFile, (bytes, percentage) => {
            if (isNaN(bytes)) bytes = 0;
            if (isNaN(percentage)) percentage = 0;
            progressBar.value = percentage;
            progressBar.detail = parseInt(bytes / 1048576) + ' megabytes downloaded.';
        }).then(() => {
            progressBar.indeterminate = true;
            progressBar.detail = 'Download complete.';
            progressBar.setCompleted();
            setTimeout(function () {
                progressBar.close();
                resolve();
            }, 3000);
        }).catch((error) => {
            progressBar.close();
            reject(error);
        });
    });
}

/**
 * extractFile - Extracts a tar archive's contents.
 * 
 * @param {String} archiveFile Archive file to extract.
 */
function extractFile(archiveFile) {
    return new Promise((resolve, reject) => {
        const path = require('path');
        const ProgressBar = require('electron-progressbar');
        const progressBar = new ProgressBar({
            indeterminate: true,
            closeOnComplete: false,
            title: 'Code Garden - Extracting',
            text: 'Please wait. Extracting...',
            style: {
                bar: {
                    "background-color": "#054b1d"
                },
                value: {
                    "background-color": "#89c23f"
                }
            },
            browserWindow: {
                icon: './images/cg.png'
            }
        });
        const tarProcess = require('child_process').spawn('tar', ['-xf', path.basename(archiveFile)], {
            cwd: path.dirname(archiveFile),
            env: {
                PATH: pathAddendum + `${process.env.PATH}${path.delimiter}`,
            },
        });
        tarProcess.on('exit', (code) => {
            if (code === 0) {
                console.log(`Archive extraction succeeded`);
                progressBar.close();
                resolve();
            } else {
                console.error(`Archive extraction failed with exit code ${code}`);
                progressBar.close();
                reject(code);
            }
        });
        tarProcess.on('error', (err) => {
            console.error(`Archive extraction failed: ${err}`);
            progressBar.close();
            reject(err);
        });
    });
}

/**
 * getDefaultLocalIP - Gets the default IP address of the host.
 * 
 * @returns {String} Default IP address of the host.
 */
function getDefaultLocalIP() {
    const os = require('os');
    const net = require('net');
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
}

/**
 * getStatus - Gets the current status of services.
 * 
 * @returns {Object} Current status of services.
 */
function getStatus() {
    const fs = require('fs');
    let status = {
        apache: false,
        nginx: false,
        php_fpm: false,
        mariadb: false,
        postgresql: false,
        samba: false
    };
    if (fs.existsSync(pwsSettings.appFolder + '/helper.lock')) {
        const { execSync } = require('child_process');
        let cmd = 'sshpass -p "' + pwsSettings.pwsPass + '" ssh -o StrictHostKeyChecking=no -p ';
        cmd += pwsSettings.sshPort + " debian@local.dev.cc \"echo '" + pwsSettings.pwsPass;
        cmd += "' | sudo -S service --status-all\"";
        const output = execSync(cmd).toString();
        status = {
            apache: output.indexOf('[ + ]  apache2') > -1,
            nginx: output.indexOf('[ + ]  nginx') > -1,
            php_fpm: output.indexOf('  php') > -1 && output.indexOf('[ - ]  php') == -1,
            mariadb: output.indexOf('[ + ]  mariadb') > -1,
            postgresql: output.indexOf('[ + ]  postgresql') > -1 //, samba: output.indexOf('[ + ]  smbd') > -1
        };
    }
    return status;
}

/**
 * initApplication - Initializes the application, set the display settings,
 * and return application settings.
 * 
 * @returns {Object} Application settings
 */
function initApplication() {

    // Hide pull down menus
    const Menu = require('electron').Menu;
    const customMenu = Menu.buildFromTemplate([]);
    Menu.setApplicationMenu(customMenu);
    
    // Hide the dock icon on macOS
    if (process.platform === 'darwin') {
        app.dock.hide();
    }

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
    const lockFile = path.join(pwsSettings.appFolder, 'main.lock');
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

    // Set /default settings
    const path = require('path');
    let pwsSettings = {
        webFolder: path.join(app.getPath('home'), 'Sites'),
        pwsPass: 'personal-web-server',
        sshPort: 8022,
        allowCG: true,
        debugMode: false,
        lanIP: getDefaultLocalIP()
    };

    // Read existing settings file
    const packageJson = require('./package.json');
    const appName = packageJson.name;
    const appFolder = path.join(app.getPath('appData'), appName);
    pwsSettings.appFolder = appFolder;
    const pwsFilePath = path.join(appFolder, 'settings.json');
    const fs = require('fs');
    if (fs.existsSync(pwsFilePath)) {
        pwsSettings = JSON.parse(fs.readFileSync(pwsFilePath));
        const CryptoJS = require('crypto-js');
        pwsSettings.pwsPass = CryptoJS.AES.decrypt(pwsSettings.pwsPass, "personal-web-server").toString(CryptoJS.enc.Utf8);
        pwsSettings.appFolder = appFolder;
    }else{
        saveSettings(pwsSettings); // Save the default settings
    }
    return pwsSettings;
}

/**
 * saveSettings - Saves the settings to the settings file.
 * 
 * @param {Object} pwsSettings Application settings.
 */
function saveSettings(pwsSettings) {
    let pwsCopy = Object.assign({}, pwsSettings); // Create a copy of the settings

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
    const CryptoJS = require('crypto-js');
    pwsCopy.pwsPass = CryptoJS.AES.encrypt(pwsCopy.pwsPass, "personal-web-server").toString();
    const path = require('path');
    const pwsFilePath = path.join(pwsCopy.appFolder, 'settings.json');
    delete pwsCopy.appFolder; // Remove the appFolder property prior to saving
    fs.writeFileSync(pwsFilePath, JSON.stringify(pwsCopy, null, 2));
}

/**
 * restartHelper - restarts the helper application.
 */
function restartHelper() {

    // Check for helper lock file, do a quick shutdown/restart if it exists
    const fs = require('fs');
    if (fs.existsSync(pwsSettings.appFolder + '/helper.lock')) {
        const { execSync } = require('child_process');
        try {
            let cmd = 'sshpass -p "' + pwsSettings.pwsPass + '" ssh -o StrictHostKeyChecking=no ';
            cmd += '-p \'' + pwsSettings.sshPort + '\' debian@local.dev.cc "echo \\"';
            cmd += pwsSettings.pwsPass + '\\" | sudo -S shutdown -r now\"';
            const output = execSync(cmd);
        } catch (error) {
            // Ignore sudden disconnect error from shutdown
        }
    
    // Otherwise, start the helper application
    } else {
        startHelper().then(() => {
            console.log('Helper started.');
        }
        ).catch((error) => {
            console.error('Unable to start helper.');
            console.error(error);
        });
    }
}

/**
 * startHelper - starts the helper application as an elevated/priveleged process.
 */
function startHelper() {
    return new Promise((resolve, reject) => {

        // Check for helper lock file
        const fs = require('fs');
        const path = require('path');
        const lockFile = path.join(pwsSettings.appFolder, 'helper.lock');
        if (!fs.existsSync(lockFile)) {

            // Instruct that authorization prompt will appear
            const dialog = require('electron').dialog;
            const nativeImage = require('electron').nativeImage;
            if (process.platform === 'darwin') {
                app.dock.show();
            }
            dialog.showMessageBoxSync({
                type: 'info',
                message: "Code Garden will now ask you for authorization to start services.\n Click OK to continue.",
                title: 'Code Garden - Information',
                icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
            });
            if (process.platform === 'darwin') {
                app.dock.hide();
            }

            // Prompt for authorization to start helper application
            const sudo = require('sudo-prompt');
            let options = {
                name: 'Code Garden'
            };
            let cmd = '';

            // Resolve helper launch command based on platform/runtime mode
            const launchedFromBundle = app.isPackaged && process.defaultApp;
            if (launchedFromBundle) {

                // macOS bundled application
                if (process.platform === 'darwin') {
                    cmd = `export ELECTRON_RUN_AS_NODE=true && "${app.getAppPath()}/../../MacOS/Code Garden" "${app.getAppPath()}/helper.js"`;
                }

                // Windows executable

                // Linux executable

            }else{

                // npm start on macOS
                if (process.platform === 'darwin') {
                    
                    // Check for out folder
                    cmd += `export ELECTRON_RUN_AS_NODE=true && "${app.getAppPath()}`;
                    if (fs.existsSync(`${app.getAppPath()}/out`)) {
                        cmd += `/out/Code Garden-darwin-x64/Code Garden.app/Contents/MacOS/Code Garden" "${app.getAppPath()}/helper.js"`;
                    }else{
                        cmd += `/../../MacOS/Code Garden" "${app.getAppPath()}/helper.js"`;
                    }
                }
            }
            sudo.exec(cmd, options, (error, stdout, stderr) => {
                if (error) {
                    console.log('startHelper error: ' + error);
                    reject(error);
                }else{
                    console.log('stdout: ' + stdout);
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

/**
 * stopHelper - stops the helper application.
 */
function stopHelper() {
    const { execSync } = require('child_process');
    try {
        let cmd = 'sshpass -p "' + pwsSettings.pwsPass + '" ssh -o StrictHostKeyChecking=no ';
        cmd += '-p \'' + pwsSettings.sshPort + '\' debian@dev.cc "echo \\"';
        cmd += pwsSettings.pwsPass + '\\" | sudo -S shutdown now\"';
        const output = execSync(cmd);
    } catch (error) {
        // Ignore sudden disconnect error from shutdown
    }
}
