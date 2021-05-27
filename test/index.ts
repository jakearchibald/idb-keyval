import 'mocha/mocha';
import chai from 'chai/chai';
import {
  get,
  set,
  del,
  promisifyRequest,
  clear,
  createStore,
  keys,
  values,
  entries,
  setMany,
  update,
  getMany,
} from '../src';
import { assert as typeAssert, IsExact } from 'conditional-type-checks';

const { assert } = chai;
mocha.setup('tdd');

(async () => {
  await promisifyRequest(indexedDB.deleteDatabase('keyval-store'));
  const customStore = createStore('custom-db', 'custom-kv');

  suite('The basics', () => {
    test('get & set', async () => {
      await set('foo', 'bar');
      assert.strictEqual(await get('foo'), 'bar', `Value can be get'd`);
      assert.strictEqual(
        await get('food'),
        undefined,
        `Non-existent values are undefined`,
      );
    });

    test('del', async () => {
      await set('foo', 'bar');
      await del('foo');

      assert.strictEqual(
        await get('foo'),
        undefined,
        `Value appears to be deleted`,
      );

      try {
        await del('food');
      } catch (err) {
        assert.fail('Deleting non-existent keys should not throw');
      }
    });

    test('clear', async () => {
      await set('foo', 'bar');
      await set('hello', 'world');
      await clear();
      assert.strictEqual(await get('foo'), undefined, `foo cleared`);
      assert.strictEqual(await get('hello'), undefined, `hello cleared`);
    });
  });

  suite('get & set', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    // Just making sure I don't accidentally cast types.
    test('number keys', async () => {
      await set(123, 'hello');
      assert.strictEqual(await get(123), 'hello', `Value can be get'd`);
      assert.strictEqual(
        await get('123'),
        undefined,
        `String equivalent doesn't exist`,
      );
    });

    test('array keys - expected fail in IE', async () => {
      await set([123, '456'], 'hello');
      assert.strictEqual(
        await get([123, '456']),
        'hello',
        `Value can be get'd`,
      );
      assert.strictEqual(
        await get(['456', 123]),
        undefined,
        `Other type key doesn't exist`,
      );
    });

    test('number values', async () => {
      await set(123, 456);
      assert.strictEqual(await get(123), 456, `Value can be get'd`);
    });

    test('object values', async () => {
      await set(123, { foo: 123, hello: 'world' });
      assert.deepStrictEqual(
        await get(123),
        { foo: 123, hello: 'world' },
        `Value can be get'd`,
      );
    });

    test('custom store', async () => {
      await set('foo', 'bar', customStore);
      assert.strictEqual(
        await get('foo'),
        undefined,
        `Doesn't exist in main db`,
      );
      assert.strictEqual(
        await get('foo', customStore),
        'bar',
        `Exists in custom db`,
      );
    });

    test('error types', async () => {
      try {
        // @ts-expect-error
        await set({}, 'foo');
        assert.fail('Expected throw');
      } catch (err) {
        assert.strictEqual(
          (err as DOMException).name,
          'DataError',
          'Error is correct type',
        );
      }

      try {
        await set('yo', document);
        assert.fail('Expected throw');
      } catch (err) {
        assert.strictEqual(
          (err as DOMException).name,
          'DataCloneError',
          'Error is correct type',
        );
      }

      try {
        // @ts-expect-error
        await get({});
        assert.fail('Expected throw');
      } catch (err) {
        assert.strictEqual(
          (err as DOMException).name,
          'DataError',
          'Error is correct type',
        );
      }
    });
  });

  suite('del', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('error types', async () => {
      try {
        // @ts-expect-error
        await del({});
        assert.fail('Expected throw');
      } catch (err) {
        assert.strictEqual(
          (err as DOMException).name,
          'DataError',
          'Error is correct type',
        );
      }
    });

    test('custom store', async () => {
      await set('foo', 'bar');
      await set('foo', 'yo', customStore);
      await del('foo', customStore);

      assert.strictEqual(
        await get('foo'),
        'bar',
        `Value is still in main store`,
      );

      assert.strictEqual(
        await get('foo', customStore),
        undefined,
        `Value is gone from custom store`,
      );
    });
  });

  suite('clear', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('custom store', async () => {
      await set('foo', 'bar');
      await set('foo', 'yo', customStore);
      await clear(customStore);

      assert.strictEqual(
        await get('foo'),
        'bar',
        `Value is still in main store`,
      );

      assert.strictEqual(
        await get('foo', customStore),
        undefined,
        `Value is gone from custom store`,
      );
    });
  });

  suite('keys', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('basics', async () => {
      await set('foo', 'bar');
      await set(123, '456');
      assert.deepEqual(await keys(), [123, 'foo'], `Got keys`);
    });

    test('custom store', async () => {
      await set('foo', 'bar');
      await set(123, '456', customStore);
      await set('hello', 'world', customStore);
      assert.deepEqual(await keys(customStore), [123, 'hello'], `Got keys`);
    });

    test('types', async () => {
      {
        const result = await keys();
        typeAssert<IsExact<typeof result, IDBValidKey[]>>(true);
      }
      {
        const result = await keys<number>();
        typeAssert<IsExact<typeof result, number[]>>(true);
      }
      // @ts-expect-error
      keys<HTMLImageElement>();
    });
  });

  suite('values', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('basics', async () => {
      await set('foo', 'bar');
      await set(123, '456');
      await set(124, { foo: 'bar' });
      assert.deepEqual(
        await values(),
        ['456', { foo: 'bar' }, 'bar'],
        `Got values`,
      );
    });

    test('custom store', async () => {
      await set('foo', 'bar');
      await set(123, '456', customStore);
      await set('hello', 'world', customStore);
      assert.deepEqual(
        await values(customStore),
        ['456', 'world'],
        `Got values`,
      );
    });

    test('types', async () => {
      {
        const result = await values();
        typeAssert<IsExact<typeof result, any[]>>(true);
      }
      {
        const result = await values<number>();
        typeAssert<IsExact<typeof result, number[]>>(true);
      }
    });
  });

  suite('entries', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('basics', async () => {
      await set('foo', 'bar');
      await set(123, '456');
      assert.deepEqual(
        await entries(),
        [
          [123, '456'],
          ['foo', 'bar'],
        ],
        `Got entries`,
      );
    });

    test('custom store', async () => {
      await set('foo', 'bar');
      await set(123, '456', customStore);
      await set('hello', 'world', customStore);
      assert.deepEqual(
        await entries(customStore),
        [
          [123, '456'],
          ['hello', 'world'],
        ],
        `Got entries`,
      );
    });

    test('types', async () => {
      {
        const result = await entries();
        typeAssert<IsExact<typeof result, [IDBValidKey, any][]>>(true);
      }
      {
        const result = await entries<number, string>();
        typeAssert<IsExact<typeof result, [number, string][]>>(true);
      }
      // @ts-expect-error
      entries<HTMLImageElement, string>();
    });
  });

  suite('setMany', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('basics', async () => {
      await setMany([
        ['foo', 'bar'],
        [123, '456'],
      ]);
      assert.deepEqual(
        await entries(),
        [
          [123, '456'],
          ['foo', 'bar'],
        ],
        `Got entries`,
      );
    });

    test('zero entries', async () => {
      try {
        await setMany([]);
      } catch (err) {
        assert.fail('Should not error with no entries');
      }

      assert.deepEqual(await entries(), [], `Got entries`);
    });

    test('custom store', async () => {
      await setMany([
        ['foo', 'bar'],
        [123, '456'],
      ]);
      await setMany(
        [
          ['hello', 'world'],
          [456, '789'],
        ],
        customStore,
      );

      assert.deepEqual(
        await entries(),
        [
          [123, '456'],
          ['foo', 'bar'],
        ],
        `Got entries`,
      );
      assert.deepEqual(
        await entries(customStore),
        [
          [456, '789'],
          ['hello', 'world'],
        ],
        `Got custom store entries`,
      );
    });
  });

  suite('getMany', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('basics', async () => {
      await setMany([
        ['foo', 'bar'],
        [123, '456'],
        ['hello', 'world'],
      ]);

      assert.deepEqual(
        await getMany(['foo', 123, 'yo']),
        ['bar', '456', undefined],
        `Got values`,
      );
    });

    test('zero entries', async () => {
      assert.deepEqual(await getMany([]), [], `Got values`);
    });

    test('custom store', async () => {
      await setMany([
        ['foo', 'bar'],
        [123, '456'],
        ['hello', 'world'],
      ]);
      await set('yo', 'ok', customStore);

      assert.deepEqual(
        await getMany(['yo', 'hello'], customStore),
        ['ok', undefined],
        `Got values`,
      );
    });

    test('types', async () => {
      {
        const result = await getMany([1, 2, 3]);
        typeAssert<IsExact<typeof result, any[]>>(true);
      }
      {
        const result = await getMany<number>([1, 2, 3]);
        typeAssert<IsExact<typeof result, number[]>>(true);
      }
    });
  });

  suite('update', () => {
    setup(() => Promise.all([clear(), clear(customStore)]));

    test('basics', async () => {
      const increment: (old: number | undefined) => number = (old) =>
        (old || 0) + 1;

      await Promise.all([
        update('count', increment),
        update('count', increment),
        update('count', increment),
      ]);

      assert.strictEqual(await get('count'), 3, 'Count');
    });

    test('error types', async () => {
      try {
        await update('count', () => document);
        assert.fail('Expected throw');
      } catch (err) {
        assert.strictEqual(
          (err as DOMException).name,
          'DataCloneError',
          'Error is correct type',
        );
      }
    });

    test('custom store', async () => {
      const increment: (old: number | undefined) => number = (old) =>
        (old || 0) + 1;

      await Promise.all([
        update('count', increment),
        update('count', increment),
        update('count', increment),
        update('count', increment, customStore),
        update('count', increment, customStore),
      ]);

      assert.strictEqual(await get('count'), 3, 'Count');
      assert.strictEqual(
        await get('count', customStore),
        2,
        'Custom store count',
      );
    });
  });

  mocha.run();
})();
