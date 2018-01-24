'use strict';

const fs = require('fs');
const path = require('path');
const globby = require('globby');

function getEntry() {
  const rootDir = path.join(process.cwd(), 'app');
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

module.exports = {
  getEntry,
};
