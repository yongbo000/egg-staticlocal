module.exports = (_, app) => {
  return async (ctx, next) => {
    const rootUrl = app.config.staticlocal.staticServer;
    // 中转热更新请求
    if (!/[0-9a-f]+\.hot-update.js(on|.map)?$|__webpack_hmr/.test(ctx.path) || !rootUrl) {
      return await next();
    }
    const assetsUrl = rootUrl + ctx.url;
    const result = await ctx.app.curl(assetsUrl, {
      streaming: true,
      timeout: 10000,
    });
    ctx.coreLogger.info('[egg-staticlocal] forward %s to %s, status: %s, headers: %j',
      ctx.url, assetsUrl, result.status, result.headers);
    ctx.set(result.headers);
    ctx.status = result.status;
    ctx.body = result.res;
  };
};
