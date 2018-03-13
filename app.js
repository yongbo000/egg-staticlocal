module.exports = app => {
  if (!app.config.staticlocal.enable) return;
  app.messenger.on('staticlocalAddressChanged', address => {
    if (!app.config.staticlocal) {
      app.config.staticlocal = {};
    }
    app.config.staticlocal.staticServer = address;
  });
  app.messenger.sendToAgent('egg-staticlocal-worker-started');
};
