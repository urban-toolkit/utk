import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import glsl from 'rollup-plugin-glsl';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import css from "rollup-plugin-import-css";

import * as meta from './package.json' assert {type: "json"};

const config = {
  input: "src/index.ts",
  output: {
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    json(),
    commonjs(),
    css(),
    glsl({
      include: ['src/shaders/*.vs', 'src/shaders/*.fs'],
      sourceMap: true
    }),
    typescript(),
  ],
  external: ['react', 'react-bootstrap', 'vega-lite', 'vega-embed', 'vega-util', 'react/jsx-runtime', 'react-dom', 'invariant', 'prop-types', 'classnames', 'warning', "vega"]
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
