export declare function promisifyRequest<T = undefined>(request: IDBRequest<T> | IDBTransaction): Promise<T>;
export declare function createStore(dbName: string, storeName: string): StoreGetter;
export declare type StoreGetter = (txMode: IDBTransactionMode) => Promise<IDBObjectStore>;
/**
 * Get a value by its key.
 *
 * @param key
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function get<T = any>(key: IDBValidKey, customStore?: StoreGetter): Promise<T | undefined>;
/**
 * Set a value with a key.
 *
 * @param key
 * @param value
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function set(key: IDBValidKey, value: any, customStore?: StoreGetter): Promise<void>;
/**
 * Set multiple values at once. This is faster than calling set() multiple times.
 * It's also atomic – if one of the pairs can't be added, none will be added.
 *
 * @param entries Array of entries, where each entry is an array of `[key, value]`.
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function setMany(entries: [IDBValidKey, any][], customStore?: StoreGetter): Promise<void>;
/**
 * Get multiple values by their keys
 *
 * @param keys
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function getMany(keys: IDBValidKey[], customStore?: StoreGetter): Promise<any[]>;
/**
 * Update a value. This lets you see the old value and update it as an atomic operation.
 *
 * @param key
 * @param updater A callback that takes the old value and returns a new value.
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function update<T = any>(key: IDBValidKey, updater: (oldValue: T | undefined) => T, customStore?: StoreGetter): Promise<void>;
/**
 * Delete a particular key from the store.
 *
 * @param key
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function del(key: IDBValidKey, customStore?: StoreGetter): Promise<void>;
/**
 * Clear all values in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function clear(customStore?: StoreGetter): Promise<void>;
/**
 * Get all keys in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function keys(customStore?: StoreGetter): Promise<IDBValidKey[]>;
/**
 * Get all values in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function values(customStore?: StoreGetter): Promise<IDBValidKey[]>;
/**
 * Get all entries in the store. Each entry is an array of `[key, value]`.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
export declare function entries(customStore?: StoreGetter): Promise<[IDBValidKey, any][]>;
//# sourceMappingURL=index.d.ts.map