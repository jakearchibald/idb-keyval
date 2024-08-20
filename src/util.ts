export function promisifyDatabaseRequest<T = undefined>(
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

export async function openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
  const q = qq[dbName] || {};
  if (!q.promise) {
    q.promise = new Promise(resolve => q.resolve = resolve);
    qq[dbName] = q;
    _openDatabase(dbName, storeName, q.resolve);
  }

  const db = await q.promise;
  delete q.promise;
  return db;
}

const databases: {[dbName: string]: IDBDatabase} = {};

async function _openDatabase(
  dbName: string, storeName: string, resolve: (db: IDBDatabase) => void
): Promise<void> {
  if (!databases[dbName]) {
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    resolve(databases[dbName] = await promisifyDatabaseRequest(request));
    return;
  }

  try {
    databases[dbName].transaction(storeName);
    resolve(databases[dbName]);
  } catch(err: any) {
    console.log(`Could not open an indexedDB transaction due to ${err.name} (${err.message}).`);
    console.log('Trying to reopen the connection...');
    // Try re-open.
    delete databases[dbName];
    _openDatabase(dbName, storeName, resolve);
  }
}