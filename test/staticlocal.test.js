'use strict';

const fs = require('fs');
const path = require('path');
const mock = require('egg-mock');
const address = require('address');
const assert = require('assert');
const coffee = require('coffee');
const buildPath = require.resolve('../bin/build');

describe('test/staticlocal.test.js', () => {
  describe('local static server', () => {
    let app;
    before(() => {
      app = mock.app({
        baseDir: 'apps/staticlocal',
      });
      return app.ready();
    });

    after(() => {
      app.close();
    });

    afterEach(mock.restore);

    it('should local static server work', () => {
      assert(app.config.staticlocal.staticServer.startsWith('http://' + address.ip()), 'should staticServer exist');
    });
  });

  it('should bin/build work', done => {
    const cwd = path.join(__dirname, './fixtures/apps/staticlocal');
    const jsonMapPath = path.join(cwd, 'config/map.json');
    coffee.fork(buildPath, [
      '--env',
      'local',
    ], {
      cwd,
    }).end(err => {
      assert.ifError(err);
      assert.ok(fs.existsSync(jsonMapPath));
      const json = require(jsonMapPath);
      assert.deepEqual(json, {
        'app_assets_entry_index.js': 'app_assets_entry_index.js',
      });
      done();
    });
  });
});
