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
} from '../src';

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

    test('array keys', async () => {
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
  });

  mocha.run();
})();
