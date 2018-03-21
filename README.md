# IDB-Keyval

[![npm](https://img.shields.io/npm/v/idb-keyval.svg)](https://www.npmjs.com/package/idb-keyval)
[![size](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/idb-keyval/dist/idb-keyval-iife.min.js?compression=gzip)](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/idb-keyval/dist/idb-keyval-iife.min.js)

This is a super-simple-small promise-based keyval store implemented with IndexedDB, largely based on [async-storage by Mozilla](https://github.com/mozilla-b2g/gaia/blob/master/shared/js/async_storage.js).

[localForage](https://github.com/localForage/localForage) offers similar functionality, but supports older browsers with broken/absent IDB implementations. Because of that, it's 7.4k, whereas idb-keyval is ~550 bytes. Also, it's tree-shaking friendly, so you'll probably end up using few than  Pick whichever works best for you!

This is only a keyval store. If you need to do more complex things like iteration & indexing, check out [IDB on NPM](https://www.npmjs.com/package/idb) (a little heavier at 1.7k). The first example in its README is how to recreate this library.

## Usage

### set:

```js
import { set } from 'idb-keyval';

set('hello', 'world');
set('foo', 'bar');
```

Since this is IDB-backed, you can store anything structured-clonable (numbers, arrays, objects, dates, blobs etc).

All methods return promises:

```js
import { set } from 'idb-keyval';

set('hello', 'world')
  .then(() => console.log('It worked!'))
  .catch(err => console.log('It failed!', err));
```

### get:

```js
import { get } from 'idb-keyval';

// logs: "world"
get('hello').then(val => console.log(val));
```

If there is no 'hello' key, then `val` will be `undefined`.

### keys:

```js
import { keys } from 'idb-keyval';

// logs: ["hello", "foo"]
keys().then(keys => console.log(keys));
```

### del:

```js
import { del } from 'idb-keyval';

del('hello');
```

### clear:

```js
import { clear } from 'idb-keyval';

clear();
```

### Custom stores:

By default, the methods above use an IndexedDB database named `keyval-store` and an object store named `keyval`. You can create your own store, and pass it as an additional parameter to any of the above methods:

```js
import { Store, set } from 'idb-keyval';

const customStore = new Store('custom-db-name', 'custom-store-name');
set('foo', 'bar', customStore);
```

That's it!

## Installing

### Via npm + webpack/rollup

```sh
npm install idb-keyval
```

Now you can require/import `idb-keyval`:

```js
import { get, set } from 'idb-keyval';
```

### Via `<script>`

* `dist/idb-keyval.mjs` is a valid JS module.
* `dist/idb-keyval-iife.js` can be used in browsers that don't support modules. `idbKeyval` is created as a global.
