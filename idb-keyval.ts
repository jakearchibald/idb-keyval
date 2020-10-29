const BUFFER_TIMEOUT = 60
const MAX_TRANSACTION_SIZE = 200

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
const pendingTransactions = new Map();

function getDefaultStore() {
  if (!store) store = new Store();
  return store;
}

function doBulkGet<Type>(store = getDefaultStore()): Promise<void> {
  const t0 = Date.now();
  let count = 0;
  return store._withIDBStore("readonly", thisTransactionObjectStore => {
      // We do one transaction involving queries.count operations
      const queries = pendingTransactions.get(store);
      if (!queries || !queries.count) return;

      const getQueries = queries.get;

      // clear this set of pending transactions so no one will add to it
      queries.get = {};
      queries.count.get = 0;

      // make all the get requests
      for (const [key, {resolve, reject}] of Object.entries(getQueries)) {
          const req = thisTransactionObjectStore.get(key);
          req.onsuccess = (e) => resolve(e.target.result);
          req.onerror = (e) => reject(e);
          count++;
      }
    })
    .then(() => console.log(`${store.storeName}: got ${count} in ${Date.now()-t0}ms`));
}

function doBulkPutDel<Type>(store = getDefaultStore()): Promise<void> {
  const t0 =  Date.now();
  let delCount = 0;
  let putCount = 0;

  return store._withIDBStore("readwrite", (thisTransactionObjectStore) => {
      // We do one transaction involving queries.count operations
      const queries = pendingTransactions.get(store);
      if (!queries || !queries.count) return;

      const putQueries = queries.put;
      const delQueries = queries.del;

      // delete this set of pending transactions so no one will add to them
      queries.put = {};
      queries.del = {};
      queries.count.put = 0;
      queries.count.del = 0;


      // make all put and del requests
      for (const [key, {value, resolve, reject}] of Object.entries(putQueries)) {
        const req = thisTransactionObjectStore.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
        putCount++;
      }

      for (const [key, {resolve, reject}] of Object.entries(delQueries)) {
        const req = thisTransactionObjectStore.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
        delCount++;
      }
    })
    .then(() => console.log(`${store.storeName}: put ${putCount}, del ${delCount} in ${Date.now()-t0}ms`));
}

/*
 * Rather than opening a new transaction for each operation, we
 * store the operations into a buffer, and perform a batch operation in
 * one transaction when nothing has been added to the buffer for BUFFER_TIMEOUT ms
 */
function addOp(store = getDefaultStore(), op: String, key: IDBValidKey, value: any) {
  return new Promise((resolve, reject) => {
    if (!pendingTransactions.has(store)) {
      pendingTransactions.set(store,
        {get: {}, put: {}, del: {}, count: {get: 0, put: 0, del: 0}});
    }
    const queries = pendingTransactions.get(store);
    queries[op][key] = {value, resolve, reject};
    const myNum = queries.count[op]++;

    /*
     * Here we set a short timeout to allow for more ops to be added.
     * when we come back, if nothing has been added then we go ahead and
     * perform a bulk transaction.
     */
    setTimeout(() => {
      if (op === "get") {
        const getCount = queries.count.get;
        if (getCount > MAX_TRANSACTION_SIZE || getCount === myNum + 1) {
          doBulkGet(store);
        }
        return;
      }

      const putDelCount = queries.count.put + queries.count.del;
      if (putDelCount > MAX_TRANSACTION_SIZE || queries.count[op] === myNum + 1) {
        doBulkPutDel(store);
      }
    }, BUFFER_TIMEOUT)
  });
}


export function get<Type>(key: IDBValidKey, store = getDefaultStore()): Promise<Type> {
  return addOp(store, "get", key);
}

export function set(key: IDBValidKey, value: any, store = getDefaultStore()): Promise<void> {
  return addOp(store, "put", key, value);
}

export function del(key: IDBValidKey, store = getDefaultStore()): Promise<void> {
  return addOp(store, "del", key);
}

/* original stuff */
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
