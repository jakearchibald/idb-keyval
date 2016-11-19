declare module 'idb-keyval' {
  interface IDBKeyVal<Key> {
    /** Add a new value or update an existing one */
    set<Value>(key: Key, value: Value): PromiseLike<void>;

    /** Get a value by key */
    get<Value>(key: Key): PromiseLike<Value>;

    /** Get all keys in the database */
    keys(): PromiseLike<Key[]>;

    /** Delete an entry in the database by key */
    delete(key: Key): PromiseLike<void>;

    /** Delete all entries in the database */
    clear(): PromiseLike<void>;
  }

  const idbKeyVal: IDBKeyVal<string>;
  export = idbKeyVal;
}
