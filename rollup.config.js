export default {
  input: 'idb-keyval.js',
  output: [{
    file: 'dist/idb-keyval-browser.js',
    format: 'iife',
    name: 'idbKeyval',
  }, {
    file: 'dist/idb-keyval.mjs',
    format: 'es',
  }, {
    file: 'dist/idb-keyval-cjs.js',
    format: 'cjs',
    name: 'idbKeyval',
  }]
}
