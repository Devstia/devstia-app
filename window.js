/**
 * Window object represent our main application window.
 */
var Window = {

    // Properties
    listeners: [],
    win: null,

    // Methods
    addEventListener: function(event, callback) {
        this.listeners.push({event: event, callback: callback});
    },
    invokeListeners: function(event, arg) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event) {
                arg = this.listeners[i].callback(arg);
            }
        }
        return arg;
    },
    removeEventListener: function(event, callback) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event && this.listeners[i].callback === callback) {
                this.listeners.splice(i, 1);
                break;
            }
        }
    },
    /**
     * show - Shows the main application window with the given file.
     * @param {*} file contains the URL to load.
     */
    show: function(file = './web/index.html') {
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
            this.invokeListeners('closed');
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
        win.loadFile(file);
    },

    /**
     * setElmTextById - updates the text within the given element by id.
     * @param {string} id - the id of the element to update.
     * @param {string} text - the inner text to set the element content to.
     */
    setElmTextById: function(id, text) {
        if (this.win == null) return;
        this.win.webContents.executeJavaScript("if (document.getElementById('" + id + "') != null) document.getElementById('" + id + "').innerText = '" + text + "';");
    }
};
module.exports = Window;