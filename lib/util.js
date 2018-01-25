'use strict';

const fs = require('fs');
const path = require('path');
const globby = require('globby');
const mkdirp = require('mkdirp');
const commonWebpackConfig = require('./webpack.config.common.js');

function getSubAppEntry(rootDir) {
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
  const files = globby.sync([ '**/entry/*.js' ], { cwd: rootDir });
  for (const f of files) {
    entry[f.replace(/\.js$/, '').replace(new RegExp(path.sep, 'g'), '_')] = path.join(rootDir, f);
  }
  return entry;
}

function getWebpackConfigPath(rootDir, env) {
  rootDir = rootDir || process.cwd();
  env = env || 'prod';
  const webpackConfigName = env === 'local' ? 'webpack.dev.config.js' : 'webpack.config.js';
  const customWebpackConfigPath = path.join(rootDir, webpackConfigName);
  let webpackConfig = require(customWebpackConfigPath)(commonWebpackConfig);
  webpackConfig.entry = getEntry(rootDir);
  if (fs.existsSync(customWebpackConfigPath)) {
    webpackConfig = require(customWebpackConfigPath)(webpackConfig);
  }
  const outPath = path.join(rootDir, 'run', webpackConfigName);
  mkdirp.sync(fs.dirname(outPath));
  fs.writeFileSync(outPath, webpackConfig, { encoding: 'utf8' });
  return outPath;
}

module.exports = {
  getEntry,
  getSubAppEntry,
  getWebpackConfigPath,
};
