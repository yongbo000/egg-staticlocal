const fs = require('fs');
const path = require('path');
const mock = require('egg-mock');
const address = require('address');
const assert = require('assert');
const coffee = require('coffee');
const rimraf = require('rimraf');
const buildPath = require.resolve('../bin/build');
const EventSource = require('eventsource');

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

describe('test/staticlocal.test.js', () => {
  describe('prod should not work', () => {
    const { reset, jsonMapPath } = commonGet('staticlocal');

    beforeEach(reset);
    after(reset);

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

    it('should local static server work', () => {
      assert(fs.existsSync(jsonMapPath) === false, 'should not exist map.json');
      assert(app.config.staticlocal.staticServer === undefined, 'should staticServer not exist');
      return app.httpRequest()
        .get('/assets_entry_index.js')
        .expect(404);
    });
  });

  describe('single app', () => {
    const { reset, jsonMapPath, cwd } = commonGet('staticlocal');

    beforeEach(reset);
    after(reset);

    describe('local static server', () => {
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

      it('should local static server work', () => {
        assert(fs.existsSync(jsonMapPath) === false, 'should not exist map.json');
        assert(app.config.staticlocal.staticServer.startsWith('http://' + address.ip()), 'should staticServer exist');
        return app.httpRequest()
          .get('/assets_entry_index.js')
          .expect(/hello,staticlocal/)
          .expect(200);
      });

      it('not css js file should 404', () => {
        return app.httpRequest()
          .get('/assets_entry_index.jsx')
          .expect(404);
      });

      it('hot reload', done => {
        const es = new EventSource(`${app.config.staticlocal.staticServer}/__webpack_hmr`);
        es.on('message', message => {
          const data = JSON.parse(message.data);
          assert(data.hash === '119f224f3c12892c9a6a', 'should hash right');
          done();
        });
      });
    });

    it('should bin/build work', done => {
      coffee.fork(buildPath, [], {
        cwd,
      }).end(err => {
        assert.ifError(err);
        assert.ok(fs.existsSync(jsonMapPath));
        const json = require(jsonMapPath);
        assert.deepEqual(json, {
          'assets_entry_index.js': 'assets_entry_index-16e48e82c1f47ec8fc84.js',
        });
        done();
      });
    });
  });

  describe('subapp', () => {
    const { reset, jsonMapPath, cwd } = commonGet('subapp');

    beforeEach(reset);
    after(reset);

    describe('local static server', () => {
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

      it('should local static server work', () => {
        assert(fs.existsSync(jsonMapPath) === false, 'should not exist map.json');
        assert(app.config.staticlocal.staticServer.startsWith('http://' + address.ip()), 'should staticServer exist');
        return app.httpRequest()
          .get('/demo.subapp.com_assets_entry_index.js')
          .set('Cookie', 'demo.subapp.com')
          .expect(/\.global body/)
          .expect(/body \.staticlocal/)
          .expect(200);
      });
    });

    it('should bin/build work', done => {
      coffee.fork(buildPath, [], {
        cwd,
      }).end(err => {
        const json = require(jsonMapPath);
        const distJs = path.join(cwd, 'dist', json['demo.subapp.com_assets_entry_index.js']);
        assert.ifError(err);
        assert.ok(fs.existsSync(jsonMapPath));
        assert.ok(fs.existsSync(distJs));
        const content = fs.readFileSync(distJs, 'utf-8');
        assert.ok(content.includes('console.log(\'hello,staticlocal\')'), 'should js build success');
        assert.ok(content.includes('.global body {\\n  margin: 10px;\\n  padding: 10px;\\n}\\nhtml body .staticlocal {\\n  margin: 0;\\n  padding: 0;\\n}'), 'should less build success');
        assert.deepEqual(json, {
          'demo.subapp.com_assets_entry_index.js': 'demo.subapp.com_assets_entry_index-b26a8fd6aae6fafe3417.js',
        });
        done();
      });
    });
  });
});
