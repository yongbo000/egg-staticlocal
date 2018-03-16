const RE_SCRIPT = /\.(?:js|jsx)$/;
const RE_STYLE = /\.(?:css|less|styl|scss|sass)$/;

function isScriptFile(fileName) {
  return RE_SCRIPT.test(fileName);
}

function isStyleFile(fileName) {
  return RE_STYLE.test(fileName);
}

module.exports = {
  getAssets(path) {
    const subAppName = this.ctx._subAppName;
    if (subAppName) {
      // assets/a.js => {assetsUrl}/{subAppName}_assets_a.js
      path = `${subAppName}_${path.replace(/\//g, '_')}`;
    } else {
      // assets/a.js => {assetsUrl}/assets_a.js
      path = `${path.replace(/\//g, '_')}`;
    }
    const config = this.app.config;
    const serverHost = config.env === 'local' ? config.staticlocal.staticServer : config.assetsUrl;
    let html = '';
    if (isScriptFile(path)) {
      html = `<script type="text/javascript" src="${serverHost}/${path.replace(RE_SCRIPT, '.js')}"></script>`;
    } else if (isStyleFile(path)) {
      html = `<link charset="utf-8" rel="stylesheet" type="text/css" href="${serverHost}/${path.replace(RE_STYLE, '.css')}"/>`;
    }
    return html;
  },
};
