export class Store {
  private _dbp: Promise<IDBDatabase>;

  constructor(dbName = 'keyval-store', readonly storeName = 'keyval') {
    const connection = (version?: number): Promise<IDBDatabase> => new Promise((resolve, reject) => {
      const openreq = indexedDB.open(dbName, version);
      openreq.onerror = () => reject(openreq.error);
      openreq.onsuccess = () => {
        // If a later version of this database wants to open,
        // close and create a new connection for the new version.
        openreq.result.onversionchange = () => {
          openreq.result.close();
          this._dbp = connection();
        }
        // If this database has been opened before, but never with this
        // storeName, the objectStore won't exist yet. In which case,
        // force an upgrade by opening a connection with version n+1.
        if (!openreq.result.objectStoreNames.contains(storeName)) {
          resolve(connection(openreq.result.version + 1));
        }
        else {
          resolve(openreq.result);
        }
      }

      // First time setup: create an empty object store
      openreq.onupgradeneeded = () => {
        openreq.result.createObjectStore(storeName);
      };
    });

    this._dbp = connection();
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
    (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
      if (!this.result) return;
      keys.push(this.result.key);
      this.result.continue()
    };
  }).then(() => keys);
}
