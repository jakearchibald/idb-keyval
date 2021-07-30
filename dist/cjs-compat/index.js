'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, '__esModule', {
  value: true
});

var safariFix = require('safari-14-idb-fix/dist/cjs-compat');

function _interopDefaultLegacy(e) {
  return e && _typeof(e) === 'object' && 'default' in e ? e : {
    'default': e
  };
}

var safariFix__default = /*#__PURE__*/_interopDefaultLegacy(safariFix);

function promisifyRequest(request) {
  return new Promise(function (resolve, reject) {
    // @ts-ignore - file size hacks
    request.oncomplete = request.onsuccess = function () {
      return resolve(request.result);
    }; // @ts-ignore - file size hacks


    request.onabort = request.onerror = function () {
      return reject(request.error);
    };
  });
}

function createStore(dbName, storeName) {
  var dbp = safariFix__default['default']().then(function () {
    var request = indexedDB.open(dbName);

    request.onupgradeneeded = function () {
      return request.result.createObjectStore(storeName);
    };

    return promisifyRequest(request);
  });
  return function (txMode, callback) {
    return dbp.then(function (db) {
      return callback(db.transaction(storeName, txMode).objectStore(storeName));
    });
  };
}

var defaultGetStoreFunc;

function defaultGetStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore('keyval-store', 'keyval');
  }

  return defaultGetStoreFunc;
}
/**
 * Get a value by its key.
 *
 * @param key
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function get(key) {
  var customStore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultGetStore();
  return customStore('readonly', function (store) {
    return promisifyRequest(store.get(key));
  });
}
/**
 * Set a value with a key.
 *
 * @param key
 * @param value
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function set(key, value) {
  var customStore = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultGetStore();
  return customStore('readwrite', function (store) {
    store.put(value, key);
    return promisifyRequest(store.transaction);
  });
}
/**
 * Set multiple values at once. This is faster than calling set() multiple times.
 * It's also atomic – if one of the pairs can't be added, none will be added.
 *
 * @param entries Array of entries, where each entry is an array of `[key, value]`.
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function setMany(entries) {
  var customStore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultGetStore();
  return customStore('readwrite', function (store) {
    entries.forEach(function (entry) {
      return store.put(entry[1], entry[0]);
    });
    return promisifyRequest(store.transaction);
  });
}
/**
 * Get multiple values by their keys
 *
 * @param keys
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function getMany(keys) {
  var customStore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultGetStore();
  return customStore('readonly', function (store) {
    return Promise.all(keys.map(function (key) {
      return promisifyRequest(store.get(key));
    }));
  });
}
/**
 * Update a value. This lets you see the old value and update it as an atomic operation.
 *
 * @param key
 * @param updater A callback that takes the old value and returns a new value.
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function update(key, updater) {
  var customStore = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultGetStore();
  return customStore('readwrite', function (store) {
    return (// Need to create the promise manually.
      // If I try to chain promises, the transaction closes in browsers
      // that use a promise polyfill (IE10/11).
      new Promise(function (resolve, reject) {
        store.get(key).onsuccess = function () {
          try {
            store.put(updater(this.result), key);
            resolve(promisifyRequest(store.transaction));
          } catch (err) {
            reject(err);
          }
        };
      })
    );
  });
}
/**
 * Delete a particular key from the store.
 *
 * @param key
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function del(key) {
  var customStore = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultGetStore();
  return customStore('readwrite', function (store) {
    store.delete(key);
    return promisifyRequest(store.transaction);
  });
}
/**
 * Clear all values in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function clear() {
  var customStore = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultGetStore();
  return customStore('readwrite', function (store) {
    store.clear();
    return promisifyRequest(store.transaction);
  });
}

function eachCursor(customStore, callback) {
  return customStore('readonly', function (store) {
    // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
    // And openKeyCursor isn't supported by Safari.
    store.openCursor().onsuccess = function () {
      if (!this.result) return;
      callback(this.result);
      this.result.continue();
    };

    return promisifyRequest(store.transaction);
  });
}
/**
 * Get all keys in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function keys() {
  var customStore = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultGetStore();
  var items = [];
  return eachCursor(customStore, function (cursor) {
    return items.push(cursor.key);
  }).then(function () {
    return items;
  });
}
/**
 * Get all values in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function values() {
  var customStore = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultGetStore();
  var items = [];
  return eachCursor(customStore, function (cursor) {
    return items.push(cursor.value);
  }).then(function () {
    return items;
  });
}
/**
 * Get all entries in the store. Each entry is an array of `[key, value]`.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */


function entries() {
  var customStore = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultGetStore();
  var items = [];
  return eachCursor(customStore, function (cursor) {
    return items.push([cursor.key, cursor.value]);
  }).then(function () {
    return items;
  });
}

exports.clear = clear;
exports.createStore = createStore;
exports.del = del;
exports.entries = entries;
exports.get = get;
exports.getMany = getMany;
exports.keys = keys;
exports.promisifyRequest = promisifyRequest;
exports.set = set;
exports.setMany = setMany;
exports.update = update;
exports.values = values;
