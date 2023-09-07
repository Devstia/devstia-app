/**
 * Window object represent our main application window.
 */
var Window = {

    // Properties
    listeners: [],
    win: null,

    // Methods
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
    on: function(event, callback) {
        this.listeners.push({event: event, callback: callback});
    },
    /**
     * show - Shows the main application window with the given file.
     * @param {*} file contains the URL to load.
     */
    show: function(file = './web/index.html') {
        if (this.win == null) {
            const BrowserWindow = require('electron').BrowserWindow;
            const path = require('path');
            let winOptions = {
                width: 600,
                height: 400,
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
            let win = this.win;
            win.on('closed', () => {
                this.invoke('closed');
                const app = require('electron').app;
                app.dock.hide();
                win = null;
            });
            win.webContents.on('did-finish-load', () => {
    
                // Set initial theme mode (light/dark)
                const nativeTheme = require('electron').nativeTheme;
                if (nativeTheme.shouldUseDarkColors) {
                    win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('dark');");
                } else {
                    win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('light');");
                }
    
                // Dynamically update the light/dark theme on OS settings change
                nativeTheme.on('updated', () => {
                    if (nativeTheme.shouldUseDarkColors) {
                        win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('dark');");
                    } else {
                        win.webContents.executeJavaScript("if (window.setThemeMode != null) setThemeMode('light');");
                    }
                });
                const app = require('electron').app;
                app.dock.show();
                win.show();
            });
        }
        this.win.loadFile(file);
    },

    /**
     * setElmTextById - updates the text within the given element by id.
     * @param {string} id - the id of the element to update.
     * @param {string} text - the inner text to set the element content to.
     */
    setElmTextById: function(id, text) {
        if (this.win == null) return;
        try {
            let script = "if (document.getElementById('" + id + "') != null) {\n";
            script += "    document.getElementById('" + id + "').innerText = '" + text + "';\n";
            script += "}else{\n"; // Retry in 1 second if element not found
            script += "    setTimeout(() => {\n";
            script += "        if (document.getElementById('" + id + "') != null) {\n";
            script += "            document.getElementById('" + id + "').innerText = '" + text + "';\n";
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