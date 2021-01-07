export function promisifyRequest<T = undefined>(
  request: IDBRequest<T> | IDBTransaction,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // @ts-ignore - file size hacks
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    // @ts-ignore - file size hacks
    request.onabort = request.onerror = () => reject(request.error);
  });
}

export function createStore(dbName: string, storeName: string) {
  const request = indexedDB.open(dbName, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  const dbp = promisifyRequest(request);

  return (txMode: IDBTransactionMode) =>
    dbp.then((db) => db.transaction(storeName, txMode).objectStore(storeName));
}

let defaultGetStoreFunc:
  | ((txMode: IDBTransactionMode) => Promise<IDBObjectStore>)
  | undefined;

function defaultGetStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore('keyval-store', 'keyval');
  }
  return defaultGetStoreFunc;
}

export function get(
  key: IDBValidKey,
  getStore = defaultGetStore(),
): Promise<any> {
  return getStore('readonly').then((store) => promisifyRequest(store.get(key)));
}

export function set(
  key: IDBValidKey,
  value: any,
  getStore = defaultGetStore(),
): Promise<void> {
  return getStore('readwrite').then((store) => {
    store.put(value, key);
    return promisifyRequest(store.transaction);
  });
}

export function del(
  key: IDBValidKey,
  getStore = defaultGetStore(),
): Promise<void> {
  return getStore('readwrite').then((store) => {
    store.delete(key);
    return promisifyRequest(store.transaction);
  });
}

export function clear(getStore = defaultGetStore()): Promise<void> {
  return getStore('readwrite').then((store) => {
    store.clear();
    return promisifyRequest(store.transaction);
  });
}

export function keys(getStore = defaultGetStore()): Promise<IDBValidKey[]> {
  const keys: IDBValidKey[] = [];

  return getStore('readonly')
    .then((store) => {
      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // And openKeyCursor isn't supported by Safari.
      (store.openKeyCursor || store.openCursor).call(
        store,
      ).onsuccess = function () {
        if (!this.result) return;
        keys.push(this.result.key);
        this.result.continue();
      };
      return promisifyRequest(store.transaction);
    })
    .then(() => keys);
}
