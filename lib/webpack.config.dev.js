'use strict';

const path = require('path');
// const webpack = require('webpack');
const util = require('./util');

module.exports = {
  output: {
    path: path.join(process.cwd(), './dist/'),
    filename: '[name].js',
    chunkFilename: '[name].js',
  },
  entry: util.getEntry(),
  module: {
    loaders: [
      // {
      //   test: /\.jsx$/,
      //   exclude: /node_modules/,
      //   loaders: ['babel-loader?stage=0'],
      // },
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   loader: 'babel-loader?stage=0',
      // },
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.less$/, loader: 'style!css!less' },
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
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'common',
    //   minChunks: 2,
    // }),
  ],
};
