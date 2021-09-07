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

function addRedirectDeclaration(fileName) {
  return {
    renderStart(_, bundle) {
      this.emitFile({
        type: 'asset',
        source: `export * from './';`,
        fileName,
      });
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
          file: 'dist/index.js',
          format: 'es',
        },
        {
          file: 'dist/index.cjs',
          format: 'cjs',
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
          file: 'dist/compat.js',
          format: 'es',
          plugins: [getBabelPlugin(), addRedirectDeclaration('compat.d.ts')],
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
          file: 'dist/compat.cjs',
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
          file: 'dist/umd.cjs',
          format: 'umd',
          name: 'idbKeyval',
          plugins: [
            addRedirectDeclaration('umd.d.ts'),
            getBabelPlugin(),
            terser({
              compress: { ecma: 5 },
            }),
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
            file: `tmp/size-tests/${basename(path)}`,
            format: 'es',
          },
        ],
      })),
    )),
  ];
}
