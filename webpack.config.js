const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  entry: {
    entry: './src/indexWEB.tsx',
  },
  output: {
    filename: "build/static/js/WidgetCL.js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env',"@babel/preset-react",
            "@babel/preset-typescript"],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      }
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [new UglifyJsPlugin()],
}

