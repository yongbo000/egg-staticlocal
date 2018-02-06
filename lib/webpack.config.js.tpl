const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const mapJsonWebpackPlugin = require('map-json-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = webpackConfig => {
  webpackConfig = require('./webpack.config.common')(webpackConfig);
  webpackConfig.output = {
    path: path.join('{{ cwd }}', 'dist'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
    publicPath: '/',
  };
  webpackConfig.plugins = webpackConfig.plugins.concat([
    new webpack.optimize.UglifyJsPlugin(),
    mapJsonWebpackPlugin({
      output: 'config/map.json',
    }),
    new ExtractTextPlugin({
      filename: '[name]-[chunkhash].css',
      allChunks: true,
    }),
  ]);

  webpackConfig.entry = {{ entry }};

  // 加载自定义配置
  const customConfigPath = path.join('{{ cwd }}', 'config/webpack.config.js');
  if (fs.existsSync(customConfigPath)) {
    webpackConfig = require(customConfigPath)(webpackConfig);
  }
  return webpackConfig;
};
