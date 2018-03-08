export default {
  input: 'idb-keyval.js',
  output: [{
    file: 'dist/idb-keyval-cjs.js',
    format: 'cjs',
    name: 'idbKeyval',
  }, {
    file: 'dist/idb-keyval.mjs',
    format: 'es',
  }]
}
