const koa = require('koa');
const webpack = require('webpack');
const util = require('./util');
const webpackDevMiddleware = require('koa-webpack-dev-middleware');
const webpackHotMiddleware = require('koa-webpack-hot-middleware');

module.exports = options => {
  const app = new koa();
  app.use(async (ctx, next) => {
    if (!/\.js$|\.css$|[0-9a-f]+\.hot-update.js(on|.map)?$|__webpack_hmr/.test(ctx.path)) {
      return;
    }
    await next();
  });

  const webpackConfigPath = util.getWebpackConfigPath(options.config.baseDir, 'local');
  const getWebpackConfig = require(webpackConfigPath);
  const compiler = webpack(getWebpackConfig());
  app.use(webpackDevMiddleware(compiler, {
    publicPath: '/',
    noInfo: true,
    progress: true,
    stats: {
      colors: true,
    },
    watchOptions: {
      ignored: /node_modules/,
    },
  }));
  app.use(webpackHotMiddleware(compiler, {
    path: '/__webpack_hmr',
    heartbeat: 3000,
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
