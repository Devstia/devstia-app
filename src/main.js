// Check for devmode argument
const args = process.argv.slice(2);
const devmode = args.includes('devmode');

const SysTray = require('systray2').default;
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises; // Use promises API for setCGIPermissions
const open = require('open');
const { createServerInstance } = require('./server/server'); // Updated path
const os = require('os'); // Make sure os is required at the top
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const semver = require('semver');

// --- Configuration ---
const PORT = 8080;
const DEFAULT_FILES = ['index.html', 'index.htm', 'index.shtml', 'index.cgi', 'index.jxml', 'index.jxm'];
const iconsDir = path.resolve(__dirname, '../images');
const ERROR_DOCS_DIR = path.resolve(__dirname, '../document_errors');

// Function to get the runtime directory
function getRuntimePlatformDir() {
    // __dirname is the directory of main.js, so go one level up then append 'runtime'
    if (process.platform === 'win32') {
        return path.resolve(__dirname, '../runtime/win_x64');
    } else if (process.platform === 'darwin') {
        // Determine architecture for macOS
        const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
        if (arch === 'arm64') {
            return path.resolve(__dirname, '../runtime/mac_arm64');
        }else if (arch === 'x64') {
            return path.resolve(__dirname, '../runtime/mac_x64');
        }
    } else if (process.platform === 'linux') {
        return path.resolve(__dirname, '../runtime/linux_x64');
    }
}

// Function to get the scripts directory
function getScriptsDir() {
    // __dirname is the directory of main.js, so go one level up then append 'scripts'
    return path.resolve(__dirname, '../scripts');
}

// Function to get the application data directory
function getAppDataDir() {
    const homedir = os.homedir();
    switch (process.platform) {
        case 'win32':
            const localAppData = process.env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local');
            return path.join(localAppData, '@virtuosoft', 'devstia-app');
        case 'darwin':
            return path.join(homedir, 'Library', 'Application Support', '@virtuosoft', 'devstia-app');
        default: // Linux, etc.
            return path.join(homedir, '.config', '@virtuosoft', 'devstia-app'); // Use .config convention
    }
}

// Function to save the preferences to the preferences.json file
function savePreferences(preferences = null) {
    const preferencesPath = path.join(APP_DATA_DIR, 'preferences.json');
    if (!fs.existsSync(APP_DATA_DIR)) {
        fs.mkdirSync(APP_DATA_DIR, { recursive: true });
    }
    if (preferences == null) {
        // Copy over the default preferences.json file
        fs.copyFileSync(path.join(__dirname, './preferences.json'), preferencesPath);
    }else{
        // Save the preferences to the preferences.json file
        fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2), 'utf8');
        console.log("Preferences saved:", preferences);
    }
}

// Function to get the preferences or default values
function getPreferences() {

    // Create the application data directory if it doesn't exist
    const preferencesPath = path.join(APP_DATA_DIR, 'preferences.json');

    // Load the preferences.json file
    if (!fs.existsSync(preferencesPath)) {
        savePreferences(null); // Create default preferences file
        console.log("Default preferences file created.");
    }
    preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
    return preferences;
}

const APP_DATA_DIR = getAppDataDir();
const ROOT_DIR = path.join(APP_DATA_DIR, 'web'); // The actual web root the server will use

// --- CGI Permissions Function (Moved from server.js) ---
async function setCGIPermissions(directory) {
    console.log(`Checking CGI permissions in ${directory}...`);
    try {
        const entries = await fsp.readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                await setCGIPermissions(fullPath);
            } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.cgi')) {
                try {
                    const stats = await fsp.stat(fullPath);
                    const mode = stats.mode;
                    if (!(mode & fs.constants.S_IXUSR)) {
                        console.warn(`Setting +x for user on: ${fullPath}`);
                        await fsp.chmod(fullPath, mode | fs.constants.S_IXUSR);
                    }
                } catch (statErr) {
                    console.error(`Error accessing/chmodding ${fullPath}:`, statErr.message);
                }
            }
        }
    } catch (readErr) {
        if (readErr.code !== 'ENOENT') { // Ignore if directory doesn't exist yet
             console.error(`Error reading directory ${directory} for CGI permissions:`, readErr.message);
        }
    }
}

// --- Main Application Logic ---
let serverInstance = null;
let systray = null;
let menu = null;
let preferences = {};

async function startApp() {
    console.log('Starting Devstia PW Application...');

    // Create systray icon and menu
    const iconExtension = process.platform === 'win32' ? 'ico' : 'png';
    let iconName = `icon.${iconExtension}`;
    let actualIconPath = '';
    if (process.platform === 'darwin') {
        const retinaIconName = `icon@2x.${iconExtension}`;
        const retinaIconPath = path.join(iconsDir, retinaIconName);
        if (fs.existsSync(retinaIconPath)) {
            iconName = retinaIconName;
            actualIconPath = retinaIconPath;
            console.log("Found retina icon:", actualIconPath);
        }
    }
    if (!actualIconPath) {
        const standardIconPath = path.join(iconsDir, iconName);
        if (fs.existsSync(standardIconPath)) {
            actualIconPath = standardIconPath;
            console.log("Found standard icon:", actualIconPath);
        } else {
             console.error(`Error: Icon file '${iconName}' not found in ${iconsDir}`);
             process.exit(1);
        }
    }

    menu = {
        icon: actualIconPath,
        title: "",
        tooltip: "Devstia PW",
        items: [
            { id: "control-panel", title: "Control Panel", tooltip: "Open the web control panel", enabled: false },
            { id: "terminal", title: "Terminal", tooltip: "Open SSH session", enabled: false },
            { id: "files", title: "Files", tooltip: "Mount file system", enabled: false },
            { id: "separator0", title: "<SEPARATOR>" },
            { id: "settings", title: "Settings", tooltip: "Open server settings", enabled: false },
            { id: "separator1", title: "<SEPARATOR>" },
            { id: "quit", title: "Quit", tooltip: "Quit & shutdown server", enabled: true }
        ]
    };

    const onClickHandler = async (action) => {
        switch (action.item.id) {
            case "control-panel":
                console.log("Control Panel clicked");
                try { await open('http://google.com'); } catch (err) { console.error('Failed to open URL:', err); }
                break;
            case "terminal": console.log("Terminal clicked"); break;
            case "files": console.log("Files clicked"); break;
            case "settings":
                console.log("Settings clicked");
                try {
                    await open(`http://localhost:${PORT}`);
                } catch (err) { console.error('Failed to open URL:', err); }
                break;
            case "quit":
                console.log("Quit clicked. Shutting down server...");
                if (serverInstance) {
                    serverInstance.close((err) => {
                        if (err) console.error("Error shutting down server:", err);
                        else console.log("Server shut down successfully.");
                        if (systray) systray.kill();
                        else process.exit(0);
                    });
                } else {
                    console.warn("Quit clicked, but serverInstance was not found.");
                    if (systray) systray.kill();
                    else process.exit(0);
                }
                break;
            default: console.log(`Clicked unhandled item: ${action.item.id}`);
        }
    };

    try {
        console.log("Initializing Systray...");
        systray = new SysTray({ menu: menu, debug: false });
        await systray.ready(); // Wait for systray to be ready
        systray.onClick(onClickHandler);
        console.log("Systray initialized object created.");
    } catch (err) {
        console.error("Failed to initialize Systray object (Caught Exception):", err);
    }

    // Initialize root directory
    try {
        preferences = getPreferences();

        // Check if Internet connection is available
        const isOnline = await new Promise((resolve) => {
            const checkOnline = () => {
                const online = navigator.onLine;
                resolve(online);
            };
            if (typeof navigator !== 'undefined') {
                checkOnline();
            } else {
                const net = require('net');
                const socket = new net.Socket();
                socket.setTimeout(2000);
                socket.on('connect', () => {
                    socket.destroy();
                    resolve(true);
                });
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });
                socket.on('error', () => {
                    socket.destroy();
                    resolve(false);
                });
                socket.connect(80, 'github.com');
            }
        });

        // Check if the root web directory exists
        if (!fs.existsSync(ROOT_DIR)) {

            // Clone the repository if it doesn't exist and we're online
            if (isOnline) {
                if (preferences['devstia-web'] == 'main') {
                    console.log("Cloning devstia-web main branch into", ROOT_DIR);
                    try {
                        await git.clone({
                            fs,
                            http,
                            dir: ROOT_DIR,
                            url: 'https://github.com/devstia/devstia-web.git',
                            ref: 'main',
                            singleBranch: true,
                            depth: 1
                        });
                        console.log("Clone complete.");
                    } catch (cloneErr) {
                        console.error("Failed to clone devstia-web:", cloneErr);
                        process.exit(1);
                    }
                } else {
                    try {
                        console.log("Fetching tags from devstia-web...");
                        const tags = await git.listServerRefs({
                            http,
                            url: 'https://github.com/devstia/devstia-web.git',
                            prefix: 'refs/tags/'
                        });

                        if (!tags.length) {
                            throw new Error("No tags found in remote repository.");
                        }

                        const tagNames = tags.map(ref => ref.ref.replace('refs/tags/', ''));
                        const latestTag = tagNames.sort(semver.rcompare)[0];
                        console.log(`Cloning latest tag (${latestTag}) into ${ROOT_DIR}`);

                        await git.clone({
                            fs,
                            http,
                            dir: ROOT_DIR,
                            url: 'https://github.com/devstia/devstia-web.git',
                            ref: latestTag,
                            singleBranch: true,
                            depth: 1
                        });
                        console.log("Clone of latest tag complete.");
                    } catch (err) {
                        console.error("Failed to clone latest tag of devstia-web:", err);
                        process.exit(1);
                    }
                }
            }else{
                console.error(`Error: No Internet connection. Cannot clone repository.`);
                process.exit(1);
            }
        } else {
            // Pull latest changes if the directory already exists and we're online
            if (isOnline && devmode == false) {
                if (preferences['devstia-web'] == 'main') {

                    // Fetch and hard reset to remote main
                    try {
                        console.log("Fetching latest from main branch...");
                        await git.fetch({
                            fs,
                            http,
                            dir: ROOT_DIR,
                            url: 'https://github.com/devstia/devstia-web.git',
                            ref: 'main',
                            singleBranch: true,
                            depth: 1
                        });
                        await git.checkout({
                            fs,
                            dir: ROOT_DIR,
                            ref: 'main',
                            force: true
                        });
                        console.log("Repo updated to latest main (force checkout).");
                    } catch (err) {
                        console.error("Failed to update main branch:", err);
                        process.exit(1);
                    }
                } else {

                    // Fetch tags, determine latest, and hard reset to that tag
                    try {
                        console.log("Fetching tags from devstia-web...");
                        const tags = await git.listServerRefs({
                            http,
                            url: 'https://github.com/devstia/devstia-web.git',
                            prefix: 'refs/tags/'
                        });

                        if (!tags.length) {
                            throw new Error("No tags found in remote repository.");
                        }

                        const tagNames = tags.map(ref => ref.ref.replace('refs/tags/', ''));
                        const latestTag = tagNames.sort(semver.rcompare)[0];
                        console.log(`Latest tag is ${latestTag}. Fetching and resetting...`);

                        await git.fetch({
                            fs,
                            http,
                            dir: ROOT_DIR,
                            url: 'https://github.com/devstia/devstia-web.git',
                            ref: latestTag,
                            singleBranch: true,
                            depth: 1
                        });
                        await git.checkout({
                            fs,
                            dir: ROOT_DIR,
                            ref: latestTag,
                            force: true
                        });
                        console.log(`Repo updated to latest tag: ${latestTag} (force checkout).`);
                    } catch (err) {
                        console.error("Failed to update to latest tag:", err);
                        process.exit(1);
                    }
                }
            }else{
                console.log(`Warning: No Internet connection. Skipping update of ${ROOT_DIR}.`);
            }
        }

    } catch (err) {
        console.error(`Failed to create or populate directory ${ROOT_DIR}:`, err);
        process.exit(1);
    }

    // Set permissions for any CGI scripts{
    await setCGIPermissions(ROOT_DIR);

    // Create server instance
    try {
        console.log("Creating server instance...");
        const devstia = {
            savePreferences: savePreferences,
            getPreferences: getPreferences,
            getAppDataDir: getAppDataDir,
            getRuntimePlatformDir: getRuntimePlatformDir,
            getScriptsDir: getScriptsDir
        };
        serverInstance = createServerInstance({
            port: PORT,
            rootDir: ROOT_DIR,
            errorDocsDir: ERROR_DOCS_DIR,
            defaultFiles: DEFAULT_FILES,
            devstia: devstia
        });

        await new Promise((resolve, reject) => {
            serverInstance.on('error', (err) => {
                console.error("Server error:", err);
                if (err.code === 'EADDRINUSE') {
                    console.error(`Error: Port ${PORT} is already in use.`);
                    reject(err);
                }
            });

            serverInstance.listen(PORT, '127.0.0.1', () => {
                console.log(`Server running at http://localhost:${PORT}/`);
                console.log(`Serving files from user directory: ${ROOT_DIR}`);
                console.log('Server is only accessible from the local machine.');

                // Enable Settings menu item when server is ready
                const settingsItem = menu.items.find(item => item.id === 'settings');
                settingsItem.enabled = true;
                systray.sendAction({ type: 'update-item', item: settingsItem });
                resolve();
            });
        });
        console.log("Server is listening.");

    } catch (err) {
        console.error("Failed to create or start server instance:", err);
        process.exit(1);
    }
    console.log("Devstia PW init complete.");
}

// --- Start the Application ---
startApp().catch(err => {
    console.error("Fatal error during app initialization:", err);
    process.exit(1);
});

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
    console.log('Received SIGINT. Exiting...');
    if (serverInstance && typeof serverInstance.close === 'function') {
        serverInstance.close(() => {
            console.log("Server closed on SIGINT.");
            if (systray) systray.kill();
            process.exit(0);
        });
    } else {
         if (systray) systray.kill();
         process.exit(0);
    }
});

