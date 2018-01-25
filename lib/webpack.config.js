'use strict';

const path = require('path');
const mapJsonWebpackPlugin = require('map-json-webpack-plugin');

module.exports = webpackConfig => {
  webpackConfig.output = {
    path: path.join(process.cwd(), './dist/'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
  };
  webpackConfig.plugins.push(mapJsonWebpackPlugin({
    output: 'config/map.json',
  }));
  return webpackConfig;
};
