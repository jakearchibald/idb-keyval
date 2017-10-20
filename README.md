# IDB-Keyval

This is a super-simple-small promise-based keyval store implemented with IndexedDB, largely based on [async-storage by Mozilla](https://github.com/mozilla-b2g/gaia/blob/master/shared/js/async_storage.js).

[localForage](https://github.com/localForage/localForage) offers similar functionality, but supports older browsers with broken/absent IDB implementations. Because of that, it's 6k, whereas idb-keyval is less than 1.2k. Pick whichever works best for you!

This is only a keyval store. If you need to do more complex things like iteration & indexing, check out [IDB on NPM](https://www.npmjs.com/package/idb) (a little heavier at 1.7k). The first example in its README is how to recreate this library. 

## Usage

### set:

```js
idbKeyval.set('hello', 'world');
idbKeyval.set('foo', 'bar');
```

Since this is IDB-backed, you can store anything structured-clonable (numbers, arrays, objects, dates, blobs etc).

All methods return promises:

```js
idbKeyval.set('hello', 'world')
  .then(() => console.log('It worked!'))
  .catch(err => console.log('It failed!', err));
```

### get:

```js
// logs: "world"
idbKeyval.get('hello').then(val => console.log(val));
```

If there is no 'hello' key, then `val` will be `undefined`.

### keys:

```js
// logs: ["hello", "foo"]
idbKeyval.keys().then(keys => console.log(keys));
```

### delete:

```js
idbKeyval.delete('hello');
```

### clear:

```js
idbKeyval.clear();
```

That's it!
