'use strict';

const koa = require('koa');
const webpack = require('webpack');
const util = require('./util');
const webpackMiddleware = require('koa-webpack-dev-middleware');

module.exports = options => {
  const app = new koa();
  app.use(async function(ctx, next) {
    if (!/\.js|\.css/.test(ctx.url)) {
      return;
    }
    await next();
  });

  const webpackConfigPath = util.getWebpackConfigPath(options.config.baseDir, 'local');
  const getWebpackConfig = require(webpackConfigPath);
  const compiler = webpack(getWebpackConfig());
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
