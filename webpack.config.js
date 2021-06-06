const { rmSync } = require('fs');
const { resolve } = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { DefinePlugin } = require('webpack');

rmSync('./dist/wp', { recursive: true, force: true });

class SplitVideoPlayerPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(this.constructor.name, (compilation) => {
      const tagFunction = (tag) => {
        switch (tag.tagName) {
          case 'script': {
            if (Object.prototype.hasOwnProperty.call(compilation.assets, tag.attributes.src)) {
              const output = {
                tagName: 'script',
                innerHTML: compilation.assets[tag.attributes.src].source(),
                closeTag: true,
              };
              delete compilation.assets[tag.attributes.src];
              return output;
            }
            break;
          }
          case 'link': {
            if (Object.prototype.hasOwnProperty.call(compilation.assets, tag.attributes.href)) {
              const output = {
                tagName: 'style',
                innerHTML: compilation.assets[tag.attributes.href].source(),
                closeTag: true,
              };
              delete compilation.assets[tag.attributes.href];
              return output;
            }
            break;
          }

          default:
            break;
        }

        return tag;
      };

      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap(
        this.constructor.name,
        (assets) => {
          assets.headTags = assets.headTags.map(tagFunction);
          assets.bodyTags = assets.bodyTags.map(tagFunction);
        },
      );
    });
  }
}

const shared = {
  output: {
    filename: '[name].js',
    path: resolve(__dirname, `./dist/wp`),
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
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
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
      ],
    },
    plugins: [
      new DefinePlugin({
        PRODUCTION: JSON.stringify(argv.mode === 'production'),
      }),
      new CopyPlugin({
        patterns: [{ from: './assets/icon.png', to: './icon.png' }],
      }),
    ],
  }),
  (env, argv) => ({
    ...shared,
    entry: {
      control: './src/ControlWindow/index.js',
    },
    target: 'electron-renderer',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                [
                  '@babel/preset-react',
                  {
                    runtime: 'automatic',
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'control.html',
        inject: 'body',
        template: './src/ControlWindow/template.html',
      }),
      new MiniCssExtractPlugin(),
      ...(argv.mode === 'production' ? [new SplitVideoPlayerPlugin()] : []),
    ],
  }),
  (env, argv) => ({
    ...shared,
    entry: {
      video: './src/VideoWindow/index.js',
    },
    target: 'electron-renderer',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                [
                  '@babel/preset-react',
                  {
                    runtime: 'automatic',
                  },
                ],
              ],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'video.html',
        inject: 'body',
        template: './src/VideoWindow/template.html',
      }),
      new MiniCssExtractPlugin(),
      ...(argv.mode === 'production' ? [new SplitVideoPlayerPlugin()] : []),
    ],
  }),
];
