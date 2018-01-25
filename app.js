'use strict';

module.exports = app => {
  app.config.coreMiddleware.push('forward');
  app.messenger.on('staticlocalAddressChanged', address => {
    app.config.staticlocal.staticServer = address;
  });
  app.messenger.sendToAgent('egg-staticlocal-worker-started');
};
