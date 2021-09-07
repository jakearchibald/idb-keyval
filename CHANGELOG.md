This only documents breaking changes. For other changes, see the commit log.

# v6

- `dist` no longer committed.
- Files have moved around.
- CommonJS files now have a `.cjs` extension.
- Sourcemaps no longer included.
- iife build switched to a UMD build.

# v5

The changes between 3.x and 5.x related to custom stores.

Old way:

```js
// This no longer works in 4.x
import { Store, set } from 'idb-keyval';

const customStore = new Store('custom-db-name', 'custom-store-name');
set('foo', 'bar', customStore);
```

New way:

```js
import { createStore, set } from 'idb-keyval';

const customStore = createStore('custom-db-name', 'custom-store-name');
set('foo', 'bar', customStore);
```

For more details, see [custom stores](./custom-stores.md).

# v4

4.x was abandoned due to a Safari bug.

# v3

2.x exported an object with methods:

```js
// This no longer works in 3.x
import idbKeyval from 'idb-keyval';

idbKeyval.set('foo', 'bar');
```

Whereas in 3.x you import the methods directly:

```js
import { set } from 'idb-keyval';

set('foo', 'bar');
```

This is better for minification, and allows tree shaking.
