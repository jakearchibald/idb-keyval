export default {
  input: 'idb-keyval.js',
  output: [{
    file: 'dist/idb-keyval-iife.js',
    format: 'iife',
    name: 'idbKeyval',
  }, {
    file: 'dist/idb-keyval-cjs.js',
    format: 'cjs',
    name: 'idbKeyval',
  }]
}
