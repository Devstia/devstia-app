const { StringDecoder } = require('string_decoder');

/**
 * Window object represent our main application window.
 */
var Window = {

    // Properties
    listeners: [],
    win: null,

    // Methods
    /**
     * alert - Displays an alert dialog with the given title and message.
     * @param {string} title - the title of the alert dialog.
     * @param {string} message - the message to display in the alert dialog.
     */
    alert: function(title, message) {
        const dialog = require('electron').dialog;
        const nativeImage = require('electron').nativeImage;
        const app = require('electron').app;
        if (process.platform === 'darwin') {
            app.dock.show();
        }
        dialog.showMessageBoxSync({
            type: 'info',
            message: message,
            title: 'CodeGarden - ' + title,
            icon: nativeImage.createFromPath(`${app.getAppPath()}/images/cg.png`)
        });
    },
    /**
     * close - Closes the main application window.
     */
    close: function() {
        if (this.win == null) return;
        this.win.close();
    },
    /**
     * executeJavaScript - Executes the given JavaScript code in the main window.
     * @param {string} script 
     */
    executeJavaScript: function(script) {
        if (this.win == null) return;
        try {
            this.win.webContents.executeJavaScript(script);
        }catch(error) {
            console.error(error);
        }
    },
    invoke: function(event, arg) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event) {
                arg = this.listeners[i].callback(arg);
            }
        }
        return arg;
    },
    /**
     * off - Unregisters a listener for the given event.
     * @param {string} event 
     */
    off: function(event) {
        this.listeners = this.listeners.filter(listener => listener.event !== event);
    },
    /**
     * on - Registers a listener for the given event.
     * @param {string} event 
     * @param {function} callback 
     */
    on: function(event, callback) {
        this.listeners.push({event: event, callback: callback});
    },
    /**
     * show - Shows application window with the given file and optional dimensions.
     * @param {*} file contains the URL to load.
     * @param {object} size optional size object with width and height properties.
     */
    show: function(file = './web/index.html', size = { width: 600, height: 400} ) {
        if (this.win == null) {
            const BrowserWindow = require('electron').BrowserWindow;
            const path = require('path');
            let winOptions = {
                width: size.width,
                height: size.height,
                modal: true,
                title: 'CodeGarden PWS',
                maximizable: false,
                minimizable: false,
                resizable: false,
                show: false,
                icon: './images/cg.png',
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js')
                    //devTools: false
                }
            }
            this.win = new BrowserWindow(winOptions);
            this.win.on('closed', () => {
                this.invoke('closed');
                const app = require('electron').app;
                app.dock.hide();
                this.listeners = [];
                this.win = null;
            });
            this.win.webContents.on('did-finish-load', () => {
    
                // Set initial theme mode (light/dark)
                const nativeTheme = require('electron').nativeTheme;
                if (nativeTheme.shouldUseDarkColors) {
                    this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('dark');");
                } else {
                    this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('light');");
                }
    
                // Dynamically update the light/dark theme on OS settings change
                nativeTheme.on('updated', () => {
                    if (this.win == null) return;
                    if (this.win.webContents == null) return;
                    if (nativeTheme.shouldUseDarkColors) {
                        this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('dark');");
                    } else {
                        this.win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('light');");
                    }
                });
                const app = require('electron').app;
                app.dock.show();
                setTimeout(() => { this.win.show(); }, 300);
            });
        }
        this.win.setSize(size.width, size.height);
        this.win.loadFile(file);
    },

    /**
     * setElmTextById - updates the text within the given element by id.
     * @param {string} id - the id of the element to update.
     * @param {string} text - the inner text to set the element content to.
     */
    setElmTextById: function(id, text) {
        if (this.win == null) return;
        text = JSON.stringify(text);
        try {
            let script = "if (document.getElementById('" + id + "') != null) {\n";
            script += "    document.getElementById('" + id + "').innerText = " + text + ";\n";
            script += "}else{\n"; // Retry in 1 second if element not found
            script += "    setTimeout(() => {\n";
            script += "        if (document.getElementById('" + id + "') != null) {\n";
            script += "            document.getElementById('" + id + "').innerText = " + text + ";\n";
            script += "        }\n";
            script += "    }, 1000);\n";
            script += "}\n";
            this.win.webContents.executeJavaScript(script);
        }catch(error) {
            console.error(error);
        }
    }
};
module.exports = Window;