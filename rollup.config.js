import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';

export default {
    input: 'idb-keyval.ts',
    plugins: [typescript(),
        babel({
            exclude: 'node_modules/**'
        })
    ],
    output: [{
        file: 'dist/idb-keyval-iife.js',
        format: 'iife',
        name: 'idbKeyval'
    }, {
        file: 'dist/idb-keyval-cjs.js',
        format: 'cjs'
    }, {
        file: 'dist/idb-keyval.mjs',
        format: 'es'
    }]
};
