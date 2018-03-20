declare module 'idb-keyval' {
  interface IDBKeyVal<Key> {
    /** Add a new value or update an existing one */
    set<Value>(key: Key, value: Value): Promise<void>;

    /** Get a value by key */
    get<Value>(key: Key): Promise<Value>;

    /** Get all keys in the database */
    keys(): Promise<Key[]>;

    /** Delete an entry in the database by key */
    delete(key: Key): Promise<void>;

    /** Delete all entries in the database */
    clear(): Promise<void>;
  }

  const idbKeyVal: IDBKeyVal<string>;
  export default idbKeyVal;
}
