import { promises as fsp } from 'fs';
import simpleTS from './lib/simple-ts';
import del from 'del';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default async function ({ watch }) {
  await del('dist');

  return [
    {
      input: 'src/index.ts',
      plugins: [simpleTS('test', { watch })],
      output: [
        {
          file: 'dist/iife/index-min.js',
          format: 'iife',
          name: 'idbKeyval',
          plugins: [
            terser({
              compress: { ecma: 2020 },
            }),
            {
              // Remove definitions from this build
              generateBundle(_, bundle) {
                for (const key of Object.keys(bundle)) {
                  if (key.includes('.d.ts')) delete bundle[key];
                }
              },
            },
          ],
        },
        {
          file: 'dist/cjs/index.js',
          format: 'cjs',
        },
        {
          file: 'dist/esm/index.mjs',
          format: 'es',
        },
      ],
    },
    {
      input: 'test/index.ts',
      plugins: [
        simpleTS('test', { noBuild: true }),
        commonjs({
          namedExports: {
            chai: ['assert'],
          },
        }),
        resolve(),
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
