/**
 * Our preload script provides a bridge between the main process and the renderer process.
 */
const { contextBridge, ipcRenderer } = require('electron');

const ipcMain = {

    // Properties
    callbacks: {},
    listeners: {},

    // Methods
    /**
     * send - allows the render process to send a message to the main process.
     * @param {string} event - the name of the event to send.
     * @param {*} message - an optional message to send, if not an object, will be wrapped in an object with a 'value' property.
     * @param {function} callback - an optional callback function to receive a response from the main process.
     */
    send: function(event, message = {}, callback = null) {

        // Store callback and invoke it when we receive a response
        if (callback != null) {
            if (typeof message == 'object' && Array.isArray(message) == false) {
                message.uuid = this.uuidv4();
            }else{
                message = { value: message, uuid: this.uuidv4() };
            }
            this.callbacks[message.uuid] = callback;
            ipcRenderer.once(message.uuid, (event, response) => {
                if (typeof this.callbacks[message.uuid] === 'function') {
                    this.callbacks[message.uuid](response);
                    delete this.callbacks[message.uuid];
                }
            });
        }
        ipcRenderer.send(event, message);
    },
    /**
     * on - allows the render process to listen for events from the main process.
     * @param {string} event - the name of the event to listen for.
     * @param {function} listener - the listener function to invoke when the event is received.
     */
    on: function(event, listener) {
        let initListener = false;
        if (this.listeners[event] == undefined) {
            this.listeners[event] = [];
            initListener = true;
        }
        this.listeners[event].push(listener);
        if (initListener) {
            ipcRenderer.on(event, (event, message) => {
                this.invoke(event, message);
            });
        }
    },
    /**
     * 
     * @param {string} event - the name of the event to invoke.
     * @param {*} message - an optional message to send, if not an object, will be wrapped in an object with a 'value' property.
     */
    invoke: function(event, message = {}) {
        if (typeof message == 'object' && Array.isArray(message) == false) {
        }else{
            message = { value: message, uuid: this.uuidv4() };
        }
        if (this.listeners[event] != undefined) {
            this.listeners[event].forEach(listener => {
                listener(this, message);
            });
        }
    },
    uuidv4: function() {
        const crypto = require('crypto');
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    } 
}
contextBridge.exposeInMainWorld('ipcMain', ipcMain);

// const { ipcRenderer } = require('electron');
// console.log('preload.js');
// process.once('loaded', () => {
//     window.addEventListener('message', event => {
//         console.log('Got message in preload.js window.addEventListener');
//         const msg = event.data;
//         console.log('Got message in preload.js window.addEventListener msg: ' + msg);
//         ipcRenderer.send('test');
//     });
//     window.xyz = "123";
// });

// const allowedMethods = [ 
//   'getSetting', 
//   'setSetting', 
//   'invokeEvent' 
// ];
// process.once('loaded', () => {
//   window.addEventListener('message', event => {
//     const msg = event.data;
//     if (msg.hasOwnProperty('method')) {
//       if (allowedMethods.includes(msg.method)) {
//         ipcRenderer.once(msg.uuid, (event, arg) => {

//           // Pass reply back to renderer process window
//           if (arg.method.startsWith('reply_')) {
//             window.postMessage(arg, window.origin);
//           }
//         });
//         ipcRenderer.send(msg.method, msg);
//       }
//     }
//   });
// });
