var idbKeyval = (function (exports) {
'use strict';

function promiseStore(openreq, storeName) {
    return new Promise((resolve, reject) => {
        openreq.onerror = () => reject(openreq.error);
        openreq.onsuccess = () => resolve(openreq.result);
        // First time setup: create an empty object store
        openreq.onupgradeneeded = () => {
            openreq.result.createObjectStore(storeName);
        };
    });
}
class Store {
    constructor(dbName = 'keyval-store', storeName = 'keyval') {
        this.storeName = storeName;
        this._dbp = promiseStore(indexedDB.open(dbName), storeName);
    }
    _withIDBStore(type, callback) {
        return this._dbp.then(db => new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, type);
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
            callback(transaction.objectStore(this.storeName));
        }));
    }
}
class MultiStore extends Store {
    constructor(dbName = 'keyval-store', storeName = 'keyval') {
        super(dbName, storeName);
        this.storeName = storeName;
        this._dbup = this._dbp.then(db => {
            if (db.objectStoreNames.contains(storeName))
                return db;
            db.close();
            return promiseStore(indexedDB.open(dbName, db.version + 1), storeName);
        });
    }
    _withIDBStore(type, callback) {
        return this._dbup.then(() => super._withIDBStore(type, callback));
    }
}
let store;
function getDefaultStore() {
    if (!store)
        store = new Store();
    return store;
}
function get(key, store = getDefaultStore()) {
    let req;
    return store._withIDBStore('readonly', store => {
        req = store.get(key);
    }).then(() => req.result);
}
function set(key, value, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.put(value, key);
    });
}
function del(key, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.delete(key);
    });
}
function clear(store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.clear();
    });
}
function keys(store = getDefaultStore()) {
    const keys = [];
    return store._withIDBStore('readonly', store => {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
            if (!this.result)
                return;
            keys.push(this.result.key);
            this.result.continue();
        };
    }).then(() => keys);
}

exports.Store = Store;
exports.MultiStore = MultiStore;
exports.get = get;
exports.set = set;
exports.del = del;
exports.clear = clear;
exports.keys = keys;

return exports;

}({}));
