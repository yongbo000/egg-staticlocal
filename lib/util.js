'use strict';

const fs = require('fs');
const path = require('path');
const globby = require('globby');
const mkdirp = require('mkdirp');

function getSubAppEntry(rootDir) {
  rootDir = path.join(rootDir, 'app');
  const names = fs.readdirSync(rootDir);
  const subApps = new Map();
  for (const name of names) {
    if (!name.match(/\.com$/) || !fs.statSync(path.join(rootDir, name)).isDirectory()) {
      continue;
    }
    subApps.set(name, {
      name,
      baseDir: path.join(rootDir, name),
    });
  }
  const entry = {};
  Array.from(subApps.values()).forEach(item => {
    const files = globby.sync([ '**/entry/*.js' ], { cwd: item.baseDir });
    for (const f of files) {
      entry[item.name + '_' + f.replace(/\.js$/, '').replace(new RegExp(path.sep, 'g'), '_')] = path.join(item.baseDir, f);
    }
  });
  return entry;
}

function getEntry(rootDir) {
  rootDir = rootDir || process.cwd();
  if (!fs.existsSync(path.join(rootDir, 'app', 'view'))) {
    return getSubAppEntry(rootDir);
  }
  const entry = {};
  const files = globby.sync([ '**/entry/*.js' ], { cwd: path.join(rootDir, 'app') });
  for (const f of files) {
    entry[f.replace(/\.js$/, '').replace(new RegExp(path.sep, 'g'), '_')] = path.join(rootDir, 'app', f);
  }
  return entry;
}

function generateConfigFile(rootDir, configFileName, model) {
  // 输出内容模版
  const template = fs.readFileSync(path.join(__dirname, `./${configFileName}.tpl`), 'utf8');
  // 输出内容
  const content = template.replace(/{{ (\w+) }}/g, (str, key) => model[key]);
  // 输出路径
  const outPath = path.join(rootDir, 'run', configFileName);
  // 创建输出目录
  mkdirp.sync(path.dirname(outPath));
  // 写入文件内容
  fs.writeFileSync(outPath, content, { encoding: 'utf8' });
}

function getWebpackConfigPath(rootDir, env) {
  rootDir = rootDir || process.cwd();
  env = env || 'prod';
  const webpackConfigFileName = env === 'local' ? 'webpack.config.dev.js' : 'webpack.config.js';

  const model = {
    cwd: rootDir,
    entry: JSON.stringify(getEntry(rootDir)),
  };

  generateConfigFile(rootDir, 'webpack.config.common.js', model);
  generateConfigFile(rootDir, webpackConfigFileName, model);

  return path.join(rootDir, 'run', webpackConfigFileName);
}

module.exports = {
  getEntry,
  getSubAppEntry,
  getWebpackConfigPath,
};
