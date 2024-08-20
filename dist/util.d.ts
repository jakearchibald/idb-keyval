export declare function promisifyRequest<T = undefined>(request: IDBRequest<T> | IDBTransaction): Promise<T>;
export declare function openDatabase(dbName: string, storeName: string, retry?: boolean): Promise<IDBDatabase>;
export declare function closeDatabase(dbName: string): Promise<void>;
