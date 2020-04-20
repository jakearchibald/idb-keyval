import { promises as fsp } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';
import simpleTS from './lib/simple-ts';
import del from 'del';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
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

function getBabelPlugin({ useESModules = false }) {
  return babel({
    presets: [['@babel/preset-env', { targets: { ie: '10' } }]],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          useESModules,
        },
      ],
    ],
    extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', '.ts'],
    runtimeHelpers: true,
  });
}

export default async function ({ watch }) {
  await del('dist');

  return [
    // Main builds
    {
      input: 'src/index.ts',
      plugins: [simpleTS('test', { watch })],
      output: [
        {
          file: 'dist/esm/index.js',
          format: 'es',
        },
        {
          file: 'dist/cjs/index.js',
          format: 'cjs',
        },
        {
          file: 'dist/iife/index-min.js',
          format: 'iife',
          name: 'idbKeyval',
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
        if (id.startsWith('@babel/runtime')) return true;
      },
      plugins: [
        simpleTS('test', { noBuild: true }),
        getBabelPlugin({ useESModules: true }),
      ],
      output: [
        {
          file: 'dist/esm-compat/index.js',
          format: 'es',
        },
      ],
    },
    {
      input: 'src/index.ts',
      external: (id) => {
        if (id.startsWith('@babel/runtime')) return true;
      },
      plugins: [
        simpleTS('test', { noBuild: true }),
        getBabelPlugin({ useESModules: false }),
      ],
      output: [
        {
          file: 'dist/cjs-compat/index.js',
          format: 'cjs',
        },
      ],
    },
    {
      input: 'src/index.ts',
      plugins: [
        simpleTS('test', { noBuild: true }),
        getBabelPlugin({ useESModules: true }),
      ],
      output: [
        {
          file: 'dist/iife-compat/index-min.js',
          format: 'iife',
          name: 'idbKeyval',
          plugins: [
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
        ],
        output: [
          {
            file: `dist/size-tests/${basename(path)}`,
            format: 'es',
          },
        ],
      })),
    )),
    // Test build
    {
      input: 'test/index.ts',
      plugins: [
        simpleTS('test', { noBuild: true }),
        commonjs(),
        resolve(),
        // Copy HTML file
        {
          async generateBundle() {
            this.emitFile({
              type: 'asset',
              source: await fsp.readFile('test/index.html'),
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
    },
  ];
}
