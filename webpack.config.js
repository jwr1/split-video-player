const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const shared = {
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, `./dist/wp`),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = [
  (env, argv) => ({
    ...shared,
    entry: {
      index: './src/electron.js',
    },
    target: 'electron-main',
    plugins: [
      new CleanWebpackPlugin(),
      new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(argv.mode === 'production'),
      }),
      new CopyPlugin({
        patterns: [{ from: './assets/icon.png', to: './icon.png' }],
      }),
    ],
  }),
  {
    ...shared,
    entry: {
      control: './src/ControlWindow/index.js',
    },
    target: 'electron-renderer',
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'control.html',
        inject: 'body',
        template: './src/ControlWindow/template.html',
      }),
    ],
  },
  {
    ...shared,
    entry: {
      video: './src/VideoWindow/index.js',
    },
    target: 'electron-renderer',
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'video.html',
        inject: 'body',
        template: './src/VideoWindow/template.html',
      }),
    ],
  },
];
