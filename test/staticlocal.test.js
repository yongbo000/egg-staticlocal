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
          assert(data.hash === '893f309ec7ba926035bf', 'should hash right');
          es.close();
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
          'assets_entry_index.js': 'assets_entry_index-3797ee2c1a0291a3a77e.js',
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
          .expect(/index\.js build success/)
          .expect(200);
      });

      it('should less entry work', () => {
        return app.httpRequest()
          .get('/demo.subapp.com_assets_entry_index.css')
          .set('Cookie', 'demo.subapp.com')
          .expect('.global body{margin:10px;padding:10px}.a .css{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}')
          .expect(200);
      });

      describe('should second subapp assets build well', () => {
        it('css build well', () => {
          return app.httpRequest()
            .get('/second.subapp.com_assets_entry_index.js')
            .set('Cookie', 'second.subapp.com')
            .expect(/index\.js build success/)
            .expect(200);
        });

        it('js build well', () => {
          return app.httpRequest()
            .get('/second.subapp.com_assets_entry_index.css')
            .set('Cookie', 'second.subapp.com')
            .expect('.global body{margin:10px;padding:10px}.a .css{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}')
            .expect(200);
        });
      });

      describe('should subdir entry build well', () => {
        it('css build well', () => {
          return app.httpRequest()
            .get('/demo.subapp.com_assets_entry_subdir_index.js')
            .set('Cookie', 'demo.subapp.com')
            .expect(/subdir\/index\.js build success/)
            .expect(200);
        });

        it('js build well', () => {
          return app.httpRequest()
            .get('/demo.subapp.com_assets_entry_subdir_index.css')
            .set('Cookie', 'demo.subapp.com')
            .expect('.a .css{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}')
            .expect(200);
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
        const distJs = path.join(cwd, 'dist', json['demo.subapp.com_assets_entry_index.js']);
        assert.ok(fs.existsSync(distJs));
        const content = fs.readFileSync(distJs, 'utf-8');
        assert.ok(content.includes('index.js build success'), 'should js build success');
        assert.ok(content.includes('import a.js success'), 'should import a.js success');
        assert.deepEqual(json, {
          'demo.subapp.com_assets_entry_index.css': 'demo.subapp.com_assets_entry_index-04f5b1b8909e65efc751.css',
          'demo.subapp.com_assets_entry_index.js': 'demo.subapp.com_assets_entry_index-04f5b1b8909e65efc751.js',
          'demo.subapp.com_assets_entry_subdir_index.css': 'demo.subapp.com_assets_entry_subdir_index-080db0614d85511feda3.css',
          'demo.subapp.com_assets_entry_subdir_index.js': 'demo.subapp.com_assets_entry_subdir_index-080db0614d85511feda3.js',
          'second.subapp.com_assets_entry_index.css': 'second.subapp.com_assets_entry_index-9e4974fcbcd5ad4afc07.css',
          'second.subapp.com_assets_entry_index.js': 'second.subapp.com_assets_entry_index-9e4974fcbcd5ad4afc07.js',
        });
        done();
      });
    });
  });
});
