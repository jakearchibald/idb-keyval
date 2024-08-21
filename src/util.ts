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

const qq: {[dbName: string]: {promise?: Promise<IDBDatabase>; resolve: (db: IDBDatabase) => void;}} = {};

export async function openDatabase(
  dbName: string, storeName: string, retry = true
): Promise<IDBDatabase> {
  const q = qq[dbName] || {};
  if (!q.promise) {
    q.promise = new Promise(resolve => q.resolve = resolve);
    qq[dbName] = q;
    _openDatabase(dbName, storeName, q.resolve, retry);
  }

  const db = await q.promise;
  delete q.promise;
  return db;
}

// Meant to be used only in specific tests
export async function closeDatabase(dbName: string) {
  if (!databases[dbName]) {
    console.assert(true, `Could not find database "${dbName}" to close.`);
    return;
  }

  databases[dbName].close();
}

const databases: {[dbName: string]: IDBDatabase} = {};

async function _openDatabase(
  dbName: string, storeName: string, resolve: (db: IDBDatabase) => void, retry: boolean
): Promise<void> {
  if (!databases[dbName]) {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    resolve(databases[dbName] = await promisifyRequest(request));
    return;
  }

  if (!retry) {
    resolve(databases[dbName]);
    return;
  }

  try {
    // Basic way to check if the db is open.
    databases[dbName].transaction(storeName);
    resolve(databases[dbName]);
  } catch (err: any) {
    // Log here on purpose.
    console.debug(
      `Could not open a transaction on "${dbName}" due to ${err.name} (${err.message}). `
        + 'Trying to reopen the connection...'
    );
    // Try re-open.
    delete databases[dbName];
    _openDatabase(dbName, storeName, resolve, retry);
  }
}