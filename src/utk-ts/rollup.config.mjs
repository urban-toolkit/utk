import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts'
import glsl from 'rollup-plugin-glsl';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy'
import css from "rollup-plugin-import-css";

import * as meta from './package.json' assert {type: "json"};

const config = [
  {
    input: "src/index.ts",
    output: {
      sourcemap: true,
      name: 'utk',
      file: 'dist/index.js',
      format: "esm",
    },
    plugins: [
      resolve(),
      json(),
      commonjs(),
      css({
        output: 'dist/style.css'
      }),
      glsl({
        include: ['src/shaders/*.vs', 'src/shaders/*.fs'],
        sourceMap: true
      }),
      typescript({
        tsconfig: "tsconfig.json",
        useTsconfigDeclarationDir: true,
        sourceMap: true,
        inlineSources: true
      }),
      copy({
        targets: [
          {'src': 'assets/*.svg', 'dest': 'dist/img/'}
        ]
      })
    ],
    external: ['react', 'react-bootstrap', 'vega-lite', 'vega-embed', 'vega-util', 'react/jsx-runtime', 'react-dom', 'invariant', 'prop-types', 'classnames', 'warning', "vega"]
  },
  {
    input: 'build/index.d.ts',
    output: [{file: 'dist/index.d.ts', format: 'es'}],
    plugins: [
      css(),
      dts()
    ]
  }
]

export default config
