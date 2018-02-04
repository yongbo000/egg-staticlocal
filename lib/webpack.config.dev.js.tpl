const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

module.exports = webpackConfig => {
  webpackConfig = require('./webpack.config.common')(webpackConfig);
  webpackConfig.output = {
    path: path.join('{{ cwd }}', 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
  };

  webpackConfig.plugins = webpackConfig.plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ]);

  webpackConfig.entry = {{ entry }};

  // 加载自定义配置
  const customConfigPath = path.join('{{ cwd }}', 'config/webpack.config.dev.js');
  if (fs.existsSync(customConfigPath)) {
    webpackConfig = require(customConfigPath)(webpackConfig);
  }
  return webpackConfig;
};
