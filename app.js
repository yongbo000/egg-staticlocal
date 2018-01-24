'use strict';

const RequireExtension = require('./lib/requireTag');

module.exports = app => {
  app.config.coreMiddleware.push('forward');
  app.messenger.on('staticlocalAddressChanged', address => {
    app.config.staticlocal.staticServer = address;
  });
  app.messenger.sendToAgent('egg-staticlocal-worker-started');

  // 添加require扩展
  app.nunjucks.addExtension('RequireExtension', new RequireExtension({
    assetsUrl: app.config.staticlocal.assetsUrl,
  }));
};
