/**
 * Tray object represents application tray/system icon with pull down menu.
 */
var Tray = {

    // Properties
    listeners: [],
    menu: null,
    //quitting: false,

    // Methods
    create: function() {
        
        // Create the tray icon
        const nativeImage = require('electron').nativeImage;
        const app = require('electron').app;
        let icon = nativeImage.createFromPath(`${app.getAppPath()}/images/dev_pw.png`)
        icon = icon.resize({
            height: 16,
            width: 16
        });
        const Tray = require('electron').Tray;
        const tray = new Tray(icon);
     
        // Create the menu
        const Menu = require('electron').Menu;
        this.menu = Menu.buildFromTemplate([
            {
                label: 'My Websites (localhost)',
                id: 'localhost',
                enabled: false,
                click: () => {
                    this.invoke('localhost');
                }
            },
            {
                label: 'Terminal',
                id: 'terminal',
                enabled: false,
                click: () => {
                    this.invoke('terminal');
                }
            },
            {
                label: 'Files',
                id: 'files',
                enabled: false,
                click: () => {
                    this.invoke('files');
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Settings',
                id: 'settings',
                enabled: false,
                click: () => {
                    this.invoke('settings');
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Quit',
                id: 'quit',
                click: () => {
                    this.invoke('quit');
                }
            }
        ]);
        tray.setContextMenu(this.menu);
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
    setMenuState: function(menuItem, enabled) {
        this.menu.getMenuItemById(menuItem).enabled = enabled;
    },
}
module.exports = Tray;