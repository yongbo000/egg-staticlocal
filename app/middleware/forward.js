module.exports = (_, app) => {
  return function* forward(next) {
    const rootUrl = app.config.staticlocal.staticServer;
    // 中转热更新请求
    if (!/[0-9a-f]+\.hot-update.js(on|.map)?$|__webpack_hmr/.test(this.path) || !rootUrl) {
      return yield next;
    }
    const assetsUrl = rootUrl + this.path;
    const result = yield this.app.curl(assetsUrl, {
      streaming: true,
      timeout: 10000,
    });
    this.coreLogger.info('[egg-staticlocal] forward %s to %s, status: %s, headers: %j',
      this.url, assetsUrl, result.status, result.headers);
    this.set(result.headers);
    this.status = result.status;
    this.body = result.res;
  };
};
