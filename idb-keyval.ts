let db: Promise<IDBDatabase>;

function getDB() {
  if (!db) {
    db = new Promise((resolve, reject) => {
      const openreq = indexedDB.open('keyval-store', 1);
      openreq.onerror = () => reject(openreq.error);
      openreq.onsuccess = () => resolve(openreq.result);

      // First time setup: create an empty object store
      openreq.onupgradeneeded = () => {
        openreq.result.createObjectStore('keyval');
      };
    });
  }
  return db;
}

function withStore(type: IDBTransactionMode, callback: ((store: IDBObjectStore) => void)): Promise<void> {
  return getDB().then(db => new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('keyval', type);
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () => reject(transaction.error);
    callback(transaction.objectStore('keyval'));
  }));
}

export function get<Type>(key: IDBValidKey): Promise<Type> {
  let req: IDBRequest;
  return withStore('readonly', store => {
    req = store.get(key);
  }).then(() => req.result);
}

export function set<Type>(key: IDBValidKey, value: any): Promise<void> {
  return withStore('readwrite', store => {
    store.put(value, key);
  });
}

export function del(key: IDBValidKey): Promise<void> {
  return withStore('readwrite', store => {
    store.delete(key);
  });
}

export function clear(): Promise<void> {
  return withStore('readwrite', store => {
    store.clear();
  });
}

export function keys(): Promise<IDBValidKey[]> {
  const keys: IDBValidKey[] = [];

  return withStore('readonly', function (store) {
    // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
    // And openKeyCursor isn't supported by Safari.
    (store.openKeyCursor || store.openCursor).call(store).onsuccess = function() {
      if (!this.result) return;
      keys.push(this.result.key);
      this.result.continue()
    };
  }).then(() => keys);
}
