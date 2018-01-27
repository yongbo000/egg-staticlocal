const fs = require('fs');
const path = require('path');
const mapJsonWebpackPlugin = require('map-json-webpack-plugin');

module.exports = webpackConfig => {
  webpackConfig = require('./webpack.config.common')(webpackConfig);
  webpackConfig.output = {
    path: path.join('{{ cwd }}', './dist/'),
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js',
  };
  webpackConfig.plugins.push(mapJsonWebpackPlugin({
    output: 'config/map.json',
  }));

  webpackConfig.entry = {{ entry }};

  // 加载自定义配置
  const customConfigPath = path.join('{{ cwd }}', 'config/webpack.config.js');
  if (fs.existsSync(customConfigPath)) {
    webpackConfig = require(customConfigPath)(webpackConfig);
  }
  return webpackConfig;
};
