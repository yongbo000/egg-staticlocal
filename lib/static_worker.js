#!/usr/bin/env node

'use strict';

const gracefulExit = require('graceful-process');
const startServer = require('./static_server');

const options = JSON.parse(process.argv[2]);

startServer(options)
  .then(info => {
    process.send(info);
  })
  .catch(err => {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  });

gracefulExit({
  logger: console,
  label: 'static_worker',
});
