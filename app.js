module.exports = app => {
  if (!app.config.staticlocal.enable) return;
  app.config.coreMiddleware.push('forward');
  app.messenger.on('staticlocalAddressChanged', address => {
    if (!app.config.staticlocal) {
      app.config.staticlocal = {};
    }
    app.config.staticlocal.staticServer = address;
  });
  app.messenger.sendToAgent('egg-staticlocal-worker-started');
};
