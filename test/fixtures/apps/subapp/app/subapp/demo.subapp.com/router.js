module.exports = app => {
  app.get('/assets.html', app.controller.dispatch.assets);
};
