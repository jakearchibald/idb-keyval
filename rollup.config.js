import { promises as fsp } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';
import simpleTS from './lib/simple-ts';
import del from 'del';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel, { getBabelOutputPlugin } from '@rollup/plugin-babel';
import glob from 'glob';

const globP = promisify(glob);

function removeDefs() {
  return {
    generateBundle(_, bundle) {
      for (const key of Object.keys(bundle)) {
        if (key.includes('.d.ts')) delete bundle[key];
      }
    },
  };
}

const babelPreset = [['@babel/preset-env', { targets: { ie: '10' } }]];

function getBabelPlugin() {
  return getBabelOutputPlugin({
    presets: babelPreset,
    allowAllFormats: true,
  });
}

export default async function ({ watch }) {
  const devBuild = watch;
  await del('dist');

  if (devBuild)
    return {
      input: 'test/index.ts',
      plugins: [
        simpleTS('test', { watch }),
        commonjs(),
        // When testing IE10
        // babel({
        //   presets: babelPreset,
        //   babelHelpers: 'runtime',
        //   extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts'],
        //   plugins: [
        //     [
        //       '@babel/plugin-transform-runtime',
        //       {
        //         useESModules: true,
        //       },
        //     ],
        //   ],
        //   exclude: /node_modules/,
        // }),
        resolve(),
        // Copy HTML file
        {
          async generateBundle() {
            this.emitFile({
              type: 'asset',
              source: await fsp.readFile(`test/index.html`),
              fileName: 'index.html',
            });
          },
        },
      ],
      output: [
        {
          file: 'dist/test/index.js',
          format: 'es',
        },
      ],
      watch: {
        clearScreen: false,
        // Don't watch the ts files. Instead we watch the output from the ts compiler.
        exclude: ['**/*.ts', '**/*.tsx'],
      },
    };

  return [
    // Main builds
    {
      input: 'src/index.ts',
      plugins: [simpleTS('src'), commonjs(), resolve()],
      external: ['safari-14-idb-fix'],
      output: [
        {
          file: 'dist/esm/index.js',
          format: 'es',
        },
        {
          file: 'dist/cjs/index.js',
          format: 'cjs',
        },
      ],
    },
    {
      input: 'src/index.ts',
      plugins: [simpleTS('src', { noBuild: true }), commonjs(), resolve()],
      output: [
        {
          file: 'dist/iife/index-min.js',
          format: 'iife',
          name: 'idbKeyval',
          esModule: false,
          plugins: [
            terser({
              compress: { ecma: 2020 },
            }),
            removeDefs(),
          ],
        },
      ],
    },
    // Compat builds
    {
      input: 'src/index.ts',
      external: (id) => {
        if (id === 'safari-14-idb-fix/dist/esm-compat') return true;
        if (id.startsWith('@babel/runtime')) return true;
      },
      plugins: [
        {
          resolveId(id) {
            if (id === 'safari-14-idb-fix') {
              return this.resolve('safari-14-idb-fix/dist/esm-compat');
            }
          },
        },
        simpleTS('src', { noBuild: true }),
        commonjs(),
        resolve(),
      ],
      output: [
        {
          file: 'dist/esm-compat/index.js',
          format: 'es',
          plugins: [getBabelPlugin()],
        },
      ],
    },
    {
      input: 'src/index.ts',
      external: (id) => {
        if (id === 'safari-14-idb-fix/dist/cjs-compat') return true;
        if (id.startsWith('@babel/runtime')) return true;
      },
      plugins: [
        {
          resolveId(id) {
            if (id === 'safari-14-idb-fix') {
              return this.resolve('safari-14-idb-fix/dist/cjs-compat');
            }
          },
        },
        simpleTS('src', { noBuild: true }),
        commonjs(),
        resolve(),
      ],
      output: [
        {
          file: 'dist/cjs-compat/index.js',
          format: 'cjs',
          plugins: [getBabelPlugin()],
        },
      ],
    },
    {
      input: 'src/index.ts',
      plugins: [simpleTS('src', { noBuild: true }), commonjs(), resolve()],
      output: [
        {
          file: 'dist/iife-compat/index-min.js',
          format: 'iife',
          name: 'idbKeyval',
          esModule: false,
          plugins: [
            getBabelPlugin(),
            terser({
              compress: { ecma: 5 },
            }),
            removeDefs(),
          ],
        },
      ],
    },
    // Size tests
    ...(await globP('size-tests/*.js').then((paths) =>
      paths.map((path) => ({
        input: path,
        plugins: [
          terser({
            compress: { ecma: 2020 },
          }),
          commonjs(),
          resolve(),
        ],
        output: [
          {
            file: `dist/size-tests/${basename(path)}`,
            format: 'es',
          },
        ],
      })),
    )),
  ];
}
