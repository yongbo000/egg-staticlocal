const address = require('address');
const path = require('path');
const childProcess = require('child_process');

module.exports = agent => {
  if (!agent.config.staticlocal.enable) return;

  const agentConfig = agent.config;

  let origin;
  const domain = address.ip();
  const protocol = 'http';

  agent.beforeStart(function* () {
    const options = {
      appname: agentConfig.name,
      config: {
        baseDir: agentConfig.baseDir,
      },
    };
    const server = yield startServer(options);
    origin = `${protocol}://${domain}:${server.port}`;
    console.info('[egg-staticlocal] %s development static server started on %s',
      agentConfig.name, origin);
  });

  agent.messenger.once('egg-ready', () => {
    agent.messenger.sendToApp('staticlocalAddressChanged', origin);
    agent.messenger.on('egg-staticlocal-worker-started', () => {
      agent.messenger.sendToApp('staticlocalAddressChanged', origin);
    });
  });
};

function startServer(options) {
  const workerFile = path.join(__dirname, 'lib/static_worker.js');
  const execArgv = [].concat(process.execArgv.filter(argv => {
    return !argv.startsWith('--debug-port') && !argv.startsWith('--inspect');
  }));
  const worker = childProcess.fork(workerFile, [ JSON.stringify(options) ], {
    stdio: 'inherit',
    execArgv,
  });
  worker.on('exit', (code, signal) => {
    if (code !== 0) {
      console.warn('[egg-staticlocal] static_worker exit code:%s, signal:%s, agent exit now',
        code, signal);
      process.exit(code);
    }
  });
  process.on('exit', () => {
    worker.kill('SIGTERM');
  });

  return new Promise(resolve => {
    worker.once('message', info => {
      resolve(info);
    });
  });
}
