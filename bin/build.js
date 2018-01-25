#!/usr/bin/env node

'use strict';

const spawn = require('child_process').spawn;
const bin = require.resolve('webpack/bin/webpack');
const getWebpackConfigPath = require('../lib/util').getWebpackConfigPath;

const program = require('commander');

program
  .version(require('../package').version, '-v, --version')
  .option('-e, --env <environment>', 'build environment')
  .parse(process.argv);

const args = [
  '--config',
  getWebpackConfigPath(process.cwd(), program.env),
];

spawn(bin, args, {
  stdio: 'inherit',
}).on('exit', process.exit);
