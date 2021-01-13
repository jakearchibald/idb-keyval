# Custom stores

Although this library allows you to use custom stores, it adds complexity and gotchas. If you need this kind of control, I recommend [IDB on NPM](https://www.npmjs.com/package/idb) instead. It's a little heavier at ~1k, but it gives you the control you need to manage things like transactions and schema migrations.

Still here? Ok, here's the deal:

## Defining a custom database & store name

The default database name is `keyval-store`, and the default store name is `keyval`. Yes, that's right, the database name contains 'store' and the store name doesn't. I don't know what I was thinking at the time, but I'm stuck with it now for compatibility.

Every method in `idb-keyval` takes an additional parameter, `customStore`, which allows you to use custom names:

```js
import { set, createStore } from 'idb-keyval';

const customStore = createStore('custom-db-name', 'custom-store-name');

set('hello', 'world', customStore);
```

But `createStore` won't let you create multiple stores within the same database. Nor will it let you create a store within an existing database.

```js
// This won't work:
const customStore = createStore('custom-db-name', 'custom-store-name');
const customStore2 = createStore('custom-db-name', 'custom-store-2');

// But this is ok, because the database name is different:
const customStore3 = createStore('db3', 'keyval');
const customStore4 = createStore('db4', 'keyval');
```

This restriction is due to how IndexedDB performs schema migrations. If you need this kind of functionality, see [IDB on NPM](https://www.npmjs.com/package/idb), which covers all the callbacks etc you need to manage multiple database connections and updates.

## Managing the custom store yourself

Ok, at this point it really is much better to use something like [IDB on NPM](https://www.npmjs.com/package/idb). But anyway:

A custom store in this library is just a function that takes `"readonly"` or `"readwrite"`, a callback that provides an IDB store, and returns whatever that callback returns. Here's the implementation for `createStore`:

```js
import { promisifyRequest } from 'idb-keyval';

function createStore(dbName, storeName) {
  const request = indexedDB.open(dbName);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  const dbp = promisifyRequest(request);

  return (txMode, callback) =>
    dbp.then((db) =>
      callback(db.transaction(storeName, txMode).objectStore(storeName)),
    );
}
```

You could create your own that does something more complicated if you want! But hey, did I mention [IDB on NPM](https://www.npmjs.com/package/idb)?
