const fs = require('fs');
const path = require('path');

module.exports = webpackConfig => {
  webpackConfig = require('./webpack.config.common')(webpackConfig);
  webpackConfig.output = {
    path: path.join('{{ cwd }}', 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
  };

  webpackConfig.entry = {{ entry }};

  // 加载自定义配置
  const customConfigPath = path.join('{{ cwd }}', 'config/webpack.config.dev.js');
  if (fs.existsSync(customConfigPath)) {
    webpackConfig = require(customConfigPath)(webpackConfig);
  }
  return webpackConfig;
};
