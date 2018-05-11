'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var Store = function () {
    function Store() {
        var dbName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'keyval-store';
        var storeName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'keyval';
        classCallCheck(this, Store);

        this.storeName = storeName;
        this._dbp = new Promise(function (resolve, reject) {
            var openreq = indexedDB.open(dbName, 1);
            openreq.onerror = function () {
                return reject(openreq.error);
            };
            openreq.onsuccess = function () {
                return resolve(openreq.result);
            };
            // First time setup: create an empty object store
            openreq.onupgradeneeded = function () {
                openreq.result.createObjectStore(storeName);
            };
        });
    }

    createClass(Store, [{
        key: '_withIDBStore',
        value: function _withIDBStore(type, callback) {
            var _this = this;

            return this._dbp.then(function (db) {
                return new Promise(function (resolve, reject) {
                    var transaction = db.transaction(_this.storeName, type);
                    transaction.oncomplete = function () {
                        return resolve();
                    };
                    transaction.onabort = transaction.onerror = function () {
                        return reject(transaction.error);
                    };
                    callback(transaction.objectStore(_this.storeName));
                });
            });
        }
    }]);
    return Store;
}();
var store = void 0;
function getDefaultStore() {
    if (!store) store = new Store();
    return store;
}
function get$1(key) {
    var store = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getDefaultStore();

    var req = void 0;
    return store._withIDBStore('readonly', function (store) {
        req = store.get(key);
    }).then(function () {
        return req.result;
    });
}
function set$1(key, value) {
    var store = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : getDefaultStore();

    return store._withIDBStore('readwrite', function (store) {
        store.put(value, key);
    });
}
function del(key) {
    var store = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getDefaultStore();

    return store._withIDBStore('readwrite', function (store) {
        store.delete(key);
    });
}
function clear() {
    var store = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getDefaultStore();

    return store._withIDBStore('readwrite', function (store) {
        store.clear();
    });
}
function keys() {
    var store = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : getDefaultStore();

    var keys = [];
    return store._withIDBStore('readonly', function (store) {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
            if (!this.result) return;
            keys.push(this.result.key);
            this.result.continue();
        };
    }).then(function () {
        return keys;
    });
}

exports.Store = Store;
exports.get = get$1;
exports.set = set$1;
exports.del = del;
exports.clear = clear;
exports.keys = keys;
