/**
 * PWS Settings API - our trusted interprocess communication channel to the main process
 * to retrieve and set settings, and invoke events.
 */

var pws = new function() {
    var callbacks = [];

    /**
     * Get a setting.
     * 
     * @param {string} name - The name of the setting.
     * @param {function} callback - The callback function to receive the value of the setting.
     */
    this.getSetting = function(name, callback) {
      let id = uuidv4().toString();
      callbacks[id] = callback;
      window.postMessage({
        method: 'getSetting',
        name: name,
        uuid: id
      });
    }

    /**
     * Set a setting internally. Not saved until invokeEvent called with 'save' method.
     * 
     * @param {string} name - The name of the setting.
     * @param {*} value - The value of the setting.
     */
    this.setSetting = function(name, value) {
      window.postMessage({
        method: 'setSetting',
        name: name,
        value: value
      });
    }

    /**
     * Invoke an event and receive an optional callback.
     * 
     * @param {string} method - The method to invoke.
     * @param {function} callback - The optional callback function to receive results.
     * @param {any} options - The optional options to pass to the method.
     */
    this.invokeEvent = function(method, callback = null, options = null) {
      let id = uuidv4().toString();
      if (callback != null) {
        callbacks[id] = callback;
      }
      window.postMessage({
        method: 'invokeEvent',
        name: method,
        options: options,
        uuid: id
      });
    }

    /**
     * Private utility function to generate a UUID.
     */
    function uuidv4() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }

    /**
     * Private method to listen for reply messages and route them to the appropriate callback.
     */
    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (msg.method.startsWith('reply_')) {
          if (callbacks[msg.uuid]) {
            callbacks[msg.uuid](msg);
            delete callbacks[msg.uuid];
          }
        }
    });
  }