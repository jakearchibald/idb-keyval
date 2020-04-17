import 'mocha/mocha';
import chai from 'chai/chai';

const { assert } = chai;
mocha.setup('tdd');

suite('foo', () => {
  test('bar', async () => {
    assert.equal('foo', 'foo');
  });
});

mocha.run();
