'use strict';

const fs = require('fs');
const path = require('path');
const koa = require('koa');
const webpack = require('webpack');
const getEntry = require('./util').getEntry;
const commonWebpackConfig = require('./webpack.config.common.js');
const getDevWebpackConfig = require('./webpack.config.dev.js');
const webpackMiddleware = require('koa-webpack-dev-middleware');

module.exports = options => {
  const app = new koa();
  app.use(async function(ctx, next) {
    if (!/\.js|\.css/.test(ctx.url)) {
      return;
    }
    await next();
  });

  let webpackConfig = getDevWebpackConfig(commonWebpackConfig);
  const customWebpackConfigPath = path.join(options.config.baseDir, 'webpack.config.dev.js');
  if (fs.existsSync(customWebpackConfigPath)) {
    webpackConfig = require(customWebpackConfigPath)(webpackConfig);
  }
  webpackConfig.entry = getEntry(options.config.baseDir);
  const compiler = webpack(webpackConfig);
  app.use(webpackMiddleware(compiler, {
    publicPath: '/',
  }));

  app.on('error', err => console.log(err));

  return new Promise(resolve => {
    // only support http
    const server = require('http').createServer(app.callback());
    server.listen(0, function() {
      const port = this.address().port;
      resolve({ port });
    });
  });
};
