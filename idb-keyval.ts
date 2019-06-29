export class Store {
  readonly _dbp: Promise<IDBDatabase>;

  constructor(dbName = 'keyval-store', readonly storeName = 'keyval') {
    this._dbp = new Promise((resolve, reject) => {
      function initialise(handleSuccess: (database: IDBDatabase) => void, version?: number) {
        const openreq = version == undefined ? indexedDB.open(dbName) : indexedDB.open(dbName, version);
        openreq.onerror = () => reject(openreq.error);
        openreq.onsuccess = () => handleSuccess(openreq.result);

        // First time setup: create an empty object store
        openreq.onupgradeneeded = () => {
          openreq.result.createObjectStore(storeName);
        };
      }

      // initialize and see if we already have the store
      initialise(db => {
        if (db.objectStoreNames.contains(storeName)) {
          // we're done
          resolve(db);
        } else {
          // initialize again by upgrading (close previous db first esp. for IE)
          db.close();
          initialise(resolve, db.version + 1);
        }
      });
    });
  }

  _withIDBStore(type: IDBTransactionMode, callback: ((store: IDBObjectStore) => void)): Promise<void> {
    return this._dbp.then(db => new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(this.storeName, type);
      transaction.oncomplete = () => resolve();
      transaction.onabort = transaction.onerror = () => reject(transaction.error);
      callback(transaction.objectStore(this.storeName));
    }));
  }
}

let store: Store;

function getDefaultStore() {
  if (!store) store = new Store();
  return store;
}

export function get<Type>(key: IDBValidKey, store = getDefaultStore()): Promise<Type> {
  let req: IDBRequest;
  return store._withIDBStore('readonly', store => {
    req = store.get(key);
  }).then(() => req.result);
}

export function set(key: IDBValidKey, value: any, store = getDefaultStore()): Promise<void> {
  return store._withIDBStore('readwrite', store => {
    store.put(value, key);
  });
}

export function del(key: IDBValidKey, store = getDefaultStore()): Promise<void> {
  return store._withIDBStore('readwrite', store => {
    store.delete(key);
  });
}

export function clear(store = getDefaultStore()): Promise<void> {
  return store._withIDBStore('readwrite', store => {
    store.clear();
  });
}

export function keys(store = getDefaultStore()): Promise<IDBValidKey[]> {
  const keys: IDBValidKey[] = [];

  return store._withIDBStore('readonly', store => {
    // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
    // And openKeyCursor isn't supported by Safari.
    (store.openKeyCursor || store.openCursor).call(store).onsuccess = function() {
      if (!this.result) return;
      keys.push(this.result.key);
      this.result.continue()
    };
  }).then(() => keys);
}
