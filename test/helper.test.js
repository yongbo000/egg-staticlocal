const path = require('path');
const assert = require('assert');
const mock = require('egg-mock');
const rimraf = require('rimraf');
const coffee = require('coffee');
const buildPath = require.resolve('../bin/build');

function commonGet(appname) {
  const cwd = path.join(__dirname, './fixtures/apps/', appname);
  const jsonMapPath = path.join(cwd, 'config/map.json');
  return {
    reset() {
      rimraf.sync(jsonMapPath);
      rimraf.sync(path.join(cwd, 'dist'));
      rimraf.sync(path.join(cwd, 'run'));
    },
    jsonMapPath,
    cwd,
  };
}

describe('test/helper.test.js', () => {
  describe('single app, should helper.getAssets() work well', () => {
    const { reset, jsonMapPath, cwd } = commonGet('staticlocal');

    beforeEach(reset);
    after(reset);

    describe('local env', () => {
      let app;
      before(() => {
        mock.env('local');
        app = mock.app({
          baseDir: 'apps/staticlocal',
        });
        return app.ready();
      });

      after(() => {
        app.close();
      });

      afterEach(mock.restore);

      it('should helper.getAssets() work well', () => {
        return app.httpRequest()
          .get('/assets.html')
          .expect(`<script type="text/javascript" src="${app.config.staticlocal.staticServer}/assets_entry_index.js"></script>\n<script type="text/javascript" src="${app.config.staticlocal.staticServer}/assets_index.entry.js"></script>\n`)
          .expect(200);
      });
    });

    describe('prod env', () => {
      let app;
      before(() => {
        mock.env('prod');
        app = mock.app({
          baseDir: 'apps/staticlocal',
        });
        return app.ready();
      });

      after(() => {
        app.close();
      });

      afterEach(mock.restore);

      it('should helper.getAssets() work well', done => {
        coffee.fork(buildPath, [], {
          cwd,
        }).end(err => {
          assert.ifError(err);
          const assetsUrl = app.config.assetsUrl;
          const assetsMapJson = require(jsonMapPath);
          app.httpRequest()
            .get('/assets.html')
            .expect(`<script type="text/javascript" src="${assetsUrl}/${assetsMapJson['assets_entry_index.js']}"></script>\n<script type="text/javascript" src="${assetsUrl}/${assetsMapJson['assets_index.entry.js']}"></script>\n`)
            .expect(200)
            .end(done);
        });
      });
    });
  });

  describe('subapp, should helper.getAssets() work well', () => {
    const { reset, jsonMapPath, cwd } = commonGet('subapp');

    beforeEach(reset);
    after(reset);

    describe('local env', () => {
      let app;
      before(() => {
        mock.env('local');
        app = mock.app({
          baseDir: 'apps/subapp',
        });
        return app.ready();
      });

      after(() => {
        app.close();
      });

      afterEach(mock.restore);

      it('should helper.getAssets() work well', () => {
        const assetsUrl = app.config.staticlocal.staticServer;
        return app.httpRequest()
          .get('/assets.html?__app=demo.subapp.com')
          .expect(`<link charset="utf-8" rel="stylesheet" type="text/css" href="${assetsUrl}/demo.subapp.com_assets_index.css"/>\n<script type="text/javascript" src="${assetsUrl}/demo.subapp.com_assets_index.entry.js"></script>\n`)
          .expect(200);
      });
    });

    describe('prod env', () => {
      let app;
      before(() => {
        mock.env('prod');
        app = mock.app({
          baseDir: 'apps/subapp',
        });
        return app.ready();
      });

      after(() => {
        app.close();
      });

      afterEach(mock.restore);

      it('should helper.getAssets() work well', done => {
        coffee.fork(buildPath, [], {
          cwd,
        }).end(err => {
          assert.ifError(err);
          const assetsUrl = app.config.assetsUrl;
          const assetsMapJson = require(jsonMapPath);
          app.httpRequest()
            .get('/assets.html')
            .set('host', 'demo.subapp.com')
            .expect(`<link charset="utf-8" rel="stylesheet" type="text/css" href="${assetsUrl}/${assetsMapJson['demo.subapp.com_assets_index.css']}"/>\n<script type="text/javascript" src="${assetsUrl}/${assetsMapJson['demo.subapp.com_assets_index.entry.js']}"></script>\n`)
            .expect(200)
            .end(done);
        });
      });
    });
  });
});
