import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import glsl from 'rollup-plugin-glsl';
import json from '@rollup/plugin-json';

import * as meta from './package.json';

const config = {
  input: "src/index.ts",
  output: {
    sourcemap: true,
  },
  plugins: [
    resolve(),
    json(),
    glsl({
      include: ['src/shaders/*.vs', 'src/shaders/*.fs'],
      sourceMap: true
    }),
    typescript(),
  ]
}

export default [
  // esm export
  {
    ...config,
    output: {
      ...config.output,
      name: 'urbantkmap',
      file: meta.main,
      format: "esm",
    }  
  },
];
