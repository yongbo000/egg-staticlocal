// import { tmpdir } from 'os';
const autoprefixer = require('autoprefixer');
const rucksack = require('rucksack-css');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = function(webpackConfig = {}) {
  // const babelOptions = {
  //   cacheDirectory: tmpdir(),
  //   presets: [
  //     require.resolve('babel-preset-es2015-ie'),
  //     require.resolve('babel-preset-react'),
  //     require.resolve('babel-preset-stage-0'),
  //   ],
  //   plugins: [
  //     require.resolve('babel-plugin-add-module-exports'),
  //     require.resolve('babel-plugin-transform-decorators-legacy'),
  //   ],
  // };
  const postcssOptions = {
    sourceMap: true,
    plugins: [
      rucksack(),
      autoprefixer({
        browsers: ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 8', 'iOS >= 8', 'Android >= 4'],
      }),
    ],
  };
  return Object.assign(webpackConfig, {
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
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                  minimize: true,
                },
              },
              {
                loader: 'postcss-loader',
                options: postcssOptions,
              },
            ],
          }),
        },
        {
          test: /\.less$/i,
          use: ExtractTextPlugin.extract({
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                  minimize: true,
                },
              },
              {
                loader: 'postcss-loader',
                options: postcssOptions,
              },
              {
                loader: 'less-loader',
                options: {
                  sourceMap: true,
                },
              },
            ],
          }),
        },
        { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff' },
        { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff' },
        { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&minetype=application/octet-stream' },
        { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
        { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&minetype=image/svg+xml' },
      ],
    },
    externals: {
    },
    plugins: [
    ],
  });
};
