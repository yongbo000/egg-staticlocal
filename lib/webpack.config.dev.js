'use strict';

const path = require('path');

module.exports = webpackConfig => {
  webpackConfig.output = {
    path: path.join(process.cwd(), './dist/'),
    filename: '[name].js',
    chunkFilename: '[name].js',
  };
  return webpackConfig;
};
