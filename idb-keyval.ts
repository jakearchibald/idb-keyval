
export class Store {
  readonly _dbp: Promise<IDBDatabase>;

  constructor(dbName = 'keyval-store', readonly storeName = 'keyval') {
    this._dbp = new Promise((resolve, reject) => {
      const openreq = indexedDB.open(dbName, 1);
      openreq.onerror = () => reject(openreq.error);
      openreq.onsuccess = () => resolve(openreq.result);

      // First time setup: create an empty object store
      openreq.onupgradeneeded = () => {
        openreq.result.createObjectStore(storeName);
      };
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

export class StoreCommand {
  constructor(public store: Store = getDefaultStore()) {}

 get<Type>(key: IDBValidKey): Promise<Type> {
    let req: IDBRequest;
    return this.store._withIDBStore('readonly', store => {
      req = store.get(key);
    }).then(() => req.result);
  }
  
  set(key: IDBValidKey, value: any): Promise<void> {
    return this.store._withIDBStore('readwrite', store => {
      store.put(value, key);
    });
  }
  
  del(key: IDBValidKey): Promise<void> {
    return this.store._withIDBStore('readwrite', store => {
      store.delete(key);
    });
  }
  
  clear(): Promise<void> {
    return this.store._withIDBStore('readwrite', store => {
      store.clear();
    });
  }
  
  keys(): Promise<IDBValidKey[]> {
    const keys: IDBValidKey[] = [];
  
    return this.store._withIDBStore('readonly', store => {
      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // And openKeyCursor isn't supported by Safari.
      (store.openKeyCursor || store.openCursor).call(store).onsuccess = function() {
        if (!this.result) return;
        keys.push(this.result.key);
        this.result.continue()
      };
    }).then(() => keys);
  }

}


