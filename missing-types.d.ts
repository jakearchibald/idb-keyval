interface IDBObjectStore {
  openKeyCursor(range?: IDBKeyRange | IDBValidKey, direction?: IDBCursorDirection): IDBRequest;
}

interface PendingTransaction {
    resolve: function;
    reject: function;
}
