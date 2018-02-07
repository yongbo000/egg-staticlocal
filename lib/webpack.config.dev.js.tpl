const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = webpackConfig => {
  webpackConfig = require('./webpack.config.common')(webpackConfig);
  webpackConfig.output = {
    path: path.join('{{ cwd }}', 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: '/',
  };

  webpackConfig.plugins = webpackConfig.plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true,
    }),
  ]);

  for (const rule of webpackConfig.module.rules) {
    if (rule.test.test('.css') || rule.test.test('.less')) {
      rule.use.unshift('css-hot-loader');
    }
  }

  webpackConfig.entry = {{ entry }};

  // 加载自定义配置
  const customConfigPath = path.join('{{ cwd }}', 'config/webpack.config.dev.js');
  if (fs.existsSync(customConfigPath)) {
    webpackConfig = require(customConfigPath)(webpackConfig);
  }
  return webpackConfig;
};
