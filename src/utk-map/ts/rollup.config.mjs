import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import glsl from 'rollup-plugin-glsl';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

import * as meta from './package.json' assert {type: "json"};

const config = {
  input: "src/index.ts",
  output: {
    sourcemap: true,
  },
  plugins: [
    resolve(),
    json(),
    commonjs(),
    glsl({
      include: ['src/shaders/*.vs', 'src/shaders/*.fs'],
      sourceMap: true
    }),
    typescript(),
  ],
  external: ['react', 'react/jsx-runtime', 'invariant', 'prop-types', 'classnames', 'warning']
}

export default [
  // esm export
  {
    ...config,
    output: {
      ...config.output,
      name: 'urbantkmap',
      file: meta.default.main,
      format: "esm",
    }  
  },
];
