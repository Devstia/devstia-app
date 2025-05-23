const SysTray = require('systray2').default;
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises; // Use promises API for setCGIPermissions
const open = require('open');
const { createServerInstance } = require('./server/server'); // Updated path
const os = require('os'); // Make sure os is required at the top

// --- Configuration ---
const PORT = 8080;
const DEFAULT_FILES = ['index.html', 'index.htm', 'index.shtml', 'index.cgi', 'index.jxm'];
const iconsDir = path.resolve(__dirname, '../images');
const ERROR_DOCS_DIR = path.resolve(__dirname, '../document_errors');
const DEFAULT_WEB_SOURCE = path.join(__dirname, '../web'); // Source of default web files
let WEBDEV_MODE = process.cwd().indexOf('.app/Contents/Resources') === -1;

// --- Determine Root Directory ---
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
const appDataDir = getAppDataDir();
let ROOT_DIR = path.join(appDataDir, 'web'); // The actual web root the server will use
if ( WEBDEV_MODE ) {
    ROOT_DIR = DEFAULT_WEB_SOURCE; // Use the repo's web folder for development
}

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
        if (!fs.existsSync(ROOT_DIR) && WEBDEV_MODE == false) {
            console.log(`Root directory (${ROOT_DIR}) not found. Copying default web content...`);
            fs.mkdirSync(ROOT_DIR, { recursive: true });
            if (fs.cpSync) {
                 fs.cpSync(DEFAULT_WEB_SOURCE, ROOT_DIR, { recursive: true });
            } else {
                await fsp.cp(DEFAULT_WEB_SOURCE, ROOT_DIR, { recursive: true });
            }
            console.log(`Default web content copied to ${ROOT_DIR}`);
        } else {
            console.log(`Web root directory exists: ${ROOT_DIR}`);
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
        serverInstance = createServerInstance({
            port: PORT,
            rootDir: ROOT_DIR,
            errorDocsDir: ERROR_DOCS_DIR,
            defaultFiles: DEFAULT_FILES
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
    console.log("Devstia PW setup complete.");
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

