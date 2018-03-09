import uglify from 'rollup-plugin-uglify';

export default {
  input: 'idb-keyval.js',
  plugins: [
    uglify(),
  ],
  output: [{
    file: 'dist/idb-keyval-browser.js',
    format: 'iife',
    name: 'idbKeyval',
  }, {
    file: 'dist/idb-keyval-min.js',
    format: 'es',
  }, {
    file: 'dist/idb-keyval-cjs.js',
    format: 'cjs',
    name: 'idbKeyval',
  }]
}
