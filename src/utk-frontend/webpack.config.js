const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin } = require("webpack");

const config = {
  entry: ["./src/index.tsx"],
  output: {
    path: path.join(__dirname, "../utk/data"),
    filename: "utk.js",
    library: "utk",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env", "@babel/react"],
        },
      },
      {
        test: /\.(ts|d.ts|tsx)$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      },
      {
        test: /\.(jpg|png|svg)$/,
        loader: "url-loader",
        options: {
          limit: Infinity, // everything
        },
      },
      {
        test: /\.(glsl|vs|fs)$/,
        loader: "raw-loader",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "public", "index.html"),
    }),
    new DefinePlugin({
      "process.env.REACT_APP_BACKEND_SERVICE_URL": JSON.stringify(
        "http://localhost:5001"
      ),
    }),
  ],

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".d.ts", ".css"],
  },
  devServer: {
    hot: false,
    devMiddleware: {
      writeToDisk: true,
    },
    static: {
      directory: path.join(__dirname, "build"),
    },
    port: 3000,
  },
  mode: "development",
};
module.exports = config;
