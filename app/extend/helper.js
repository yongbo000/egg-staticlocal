const fs = require('fs');
const path = require('path');
const RE_SCRIPT = /\.(?:js|jsx)$/;
const RE_STYLE = /\.(?:css|less|styl|scss|sass)$/;

function isScriptFile(fileName) {
  return RE_SCRIPT.test(fileName);
}

function isStyleFile(fileName) {
  return RE_STYLE.test(fileName);
}

let assetsMapJson = {};

module.exports = {
  getAssets(url) {
    const assetsMapPath = path.join(this.app.baseDir, 'config', 'map.json');
    if (fs.existsSync(assetsMapPath)) {
      assetsMapJson = require(assetsMapPath);
    }

    const subAppName = this.ctx.subApp && this.ctx.subApp.name;
    if (subAppName) {
      // assets/a.js => {assetsUrl}/{subAppName}_assets_a.js
      url = `${subAppName}_${url.replace(/\//g, '_')}`;
    } else {
      // assets/a.js => {assetsUrl}/assets_a.js
      url = `${url.replace(/\//g, '_')}`;
    }

    const config = this.app.config;
    const serverHost = config.env === 'local' ? config.staticlocal.staticServer : config.assetsUrl;
    let html = '';
    if (isScriptFile(url)) {
      url = url.replace(RE_SCRIPT, '.js');
      const p = config.env === 'local' ? url : assetsMapJson[url];
      html = `<script type="text/javascript" src="${serverHost}/${p}"></script>`;
    } else if (isStyleFile(url)) {
      url = url.replace(RE_STYLE, '.css');
      const p = config.env === 'local' ? url : assetsMapJson[url];
      html = `<link charset="utf-8" rel="stylesheet" type="text/css" href="${serverHost}/${p}"/>`;
    }
    return html;
  },
};
