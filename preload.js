/**
 * Our preload script provides a bridge between the main process and the renderer process.
 */

const { ipcRenderer } = require('electron');
process.once('loaded', () => {
  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.hasOwnProperty('method')) {
      if ([ 'getSetting', 'setSetting', 'invokeEvent' ].includes(msg.method)) {
        ipcRenderer.once(msg.uuid, (event, arg) => {

          // Pass reply back to renderer process window
          if (arg.method.startsWith('reply_')) {
            window.postMessage(arg, window.origin);
          }
        });
        ipcRenderer.send(msg.method, msg);
      }
    }
  });

});
