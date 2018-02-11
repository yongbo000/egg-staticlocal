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
          'assets_entry_index.js': 'assets_entry_index-e6e860cd1071d38de1d0.js',
        });
        const distJs = path.join(cwd, 'dist', json['assets_entry_index.js']);
        const content = fs.readFileSync(distJs, 'utf-8');
        assert.ok(content.includes('hello,staticlocal'), 'should js build success');
        assert.ok(!content.includes('Hot Module Replacement'), 'should no hrm');
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

    describe('should bin/build work', () => {
      it('bin/build --env prod', done => {
        coffee.fork(buildPath, [], {
          cwd,
        }).end(err => {
          assert.ifError(err);
          assert.ok(fs.existsSync(jsonMapPath));
          const json = require(jsonMapPath);
          assert.deepEqual(json, {
            'demo.subapp.com_assets_entry_index.css': 'demo.subapp.com_assets_entry_index-e0736bd3fead4eec51a9.css',
            'demo.subapp.com_assets_entry_index.js': 'demo.subapp.com_assets_entry_index-e0736bd3fead4eec51a9.js',
            'demo.subapp.com_assets_entry_subdir_index.css': 'demo.subapp.com_assets_entry_subdir_index-c6f035092e1009e0277e.css',
            'demo.subapp.com_assets_entry_subdir_index.js': 'demo.subapp.com_assets_entry_subdir_index-c6f035092e1009e0277e.js',
            'second.subapp.com_assets_entry_index.css': 'second.subapp.com_assets_entry_index-90386515deb511d91029.css',
            'second.subapp.com_assets_entry_index.js': 'second.subapp.com_assets_entry_index-90386515deb511d91029.js',
          });
          const distJs = path.join(cwd, 'dist', json['demo.subapp.com_assets_entry_index.js']);
          const webpackConfigJs = path.join(cwd, 'run/webpack.config.js');
          const webpackDevConfigJs = path.join(cwd, 'run/webpack.configd.dev.js');
          assert.ok(fs.existsSync(distJs));
          assert.ok(fs.existsSync(webpackConfigJs));
          assert.ok(!fs.existsSync(webpackDevConfigJs));
          const content = fs.readFileSync(distJs, 'utf-8');
          assert.ok(content.includes('index.js build success'), 'should js build success');
          assert.ok(content.includes('import a.js success'), 'should import a.js success');
          assert.ok(!content.includes('Hot Module Replacement'), 'should no hrm');

          const webpackConfig = require(webpackConfigJs)({});
          const hasHmr = Object.keys(webpackConfig.entry).some(key => {
            if (Array.isArray(webpackConfig.entry[key])) {
              return webpackConfig.entry[key].some(filePath => {
                return filePath.includes('__webpack_hmr');
              });
            }
            return webpackConfig.entry[key].includes('__webpack_hmr');
          });
          assert.equal(hasHmr, false, 'should has hrm');
          done();
        });
      });

      it('bin/build --env local', done => {
        coffee.fork(buildPath, [
          '--env',
          'local',
        ], {
          cwd,
        }).end(err => {
          assert.ifError(err);
          assert.ok(!fs.existsSync(jsonMapPath));
          const webpackConfigJs = path.join(cwd, 'run/webpack.config.js');
          const webpackDevConfigJs = path.join(cwd, 'run/webpack.config.dev.js');
          assert.ok(!fs.existsSync(webpackConfigJs));
          assert.ok(fs.existsSync(webpackDevConfigJs));
          const webpackDevConfig = require(webpackDevConfigJs)({});
          const hasHmr = Object.keys(webpackDevConfig.entry).some(key => {
            if (Array.isArray(webpackDevConfig.entry[key])) {
              return webpackDevConfig.entry[key].some(filePath => {
                return filePath.includes('__webpack_hmr');
              });
            }
            return webpackDevConfig.entry[key].includes('__webpack_hmr');
          });
          assert.equal(hasHmr, true, 'should has hrm');
          done();
        });
      });
    });
  });
});
