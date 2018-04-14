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

function getRequest(app) {
  return async url => {
    url = `${app.config.staticlocal.staticServer}/${url}`;
    return await app.curl(url, {
      dataType: 'text',
    });
  };
}

describe('test/staticlocal.test.js', () => {
  let request;
  describe('prod env', () => {
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

    it('should no local static server ', async () => {
      assert(fs.existsSync(jsonMapPath) === false, 'should not exist map.json');
      assert(app.config.staticlocal.staticServer === undefined, 'should staticServer not exist');
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
        request = getRequest(app);
        return app.ready();
      });

      after(() => {
        app.close();
      });

      afterEach(mock.restore);

      it('should local static server work', async () => {
        assert(fs.existsSync(jsonMapPath) === false, 'should not exist map.json');
        assert(app.config.staticlocal.staticServer.startsWith('http://' + address.ip()), 'should staticServer exist');
        let ret = await request('/assets_entry_index.js');
        assert(/hello,staticlocal/.test(ret.data));
        ret = await request('/assets_index.entry.js');
        assert(/hello,index.entry.js/.test(ret.data));
      });

      it('with query params', async () => {
        const ret = await request('/assets_entry_index.js?t=111111');
        assert(/hello,staticlocal/.test(ret.data));
      });

      it('not css js file should 404', async () => {
        const ret = await request('/assets_entry_index.jsx');
        assert(ret.status === 404);
      });

      it('hot reload', done => {
        const ret = app.httpRequest().get('/__webpack_hmr');
        const es = new EventSource(ret.url);
        es.on('open', message => {
          assert(message.type === 'open');
        });
        es.on('message', message => {
          const data = JSON.parse(message.data);
          assert(data.hash === '28711f9ae9c03ac96a0e', 'should hash right');
          es.close();
          done();
        });
      });

      it('view should render success', async () => {
        return app.httpRequest()
          .get('/assets.html')
          .expect(`<script type="text/javascript" src="${app.config.staticlocal.staticServer}/entry_index.js"></script>\n<script type="text/javascript" src="${app.config.staticlocal.staticServer}/assets_index.entry.js"></script>\n`)
          .expect(200);
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
          'assets_entry_index.js': 'assets_entry_index-abbbd507b9a74e723b71.js',
          'assets_index.entry.js': 'assets_index.entry-7dab7296b9837c7e680e.js',
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
        request = getRequest(app);
        return app.ready();
      });

      after(() => {
        app.close();
      });

      afterEach(mock.restore);

      it('should local static server work', async () => {
        assert(fs.existsSync(jsonMapPath) === false, 'should not exist map.json');
        assert(app.config.staticlocal.staticServer.startsWith('http://' + address.ip()), 'should staticServer exist');
        let ret = await request('/demo.subapp.com_assets_entry_index.js');
        assert(/index\.js build success/.test(ret.data));
        ret = await request('/demo.subapp.com_assets_index.entry.js');
        assert(/hello,index.entry.js/.test(ret.data));
      });

      it('with query params', async () => {
        const ret = await request('/demo.subapp.com_assets_entry_index.js?t=111111');
        assert(/index\.js build success/.test(ret.data));
      });

      it('should less entry work', async () => {
        const ret = await request('/demo.subapp.com_assets_entry_index.css');
        assert(ret.data === '.global body{margin:10px;padding:10px}.a .css{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}');
      });

      describe('should second subapp assets build well', () => {
        it('css build well', async () => {
          const ret = await request('/second.subapp.com_assets_entry_index.js');
          assert(/index\.js build success/.test(ret.data));
        });

        it('js build well', async () => {
          const ret = await request('/second.subapp.com_assets_entry_index.css');
          assert(ret.data === '.global body{margin:10px;padding:10px}.a .css{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}');
        });
      });

      describe('should subdir entry build well', () => {
        it('css build well', async () => {
          const ret = await request('/demo.subapp.com_assets_entry_subdir_index.js');
          assert(/subdir\/index\.js build success/.test(ret.data));
        });

        it('js build well', async () => {
          const ret = await request('/demo.subapp.com_assets_entry_subdir_index.css');
          assert(ret.data === '.a .css{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}');
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
            'demo.subapp.com_assets_entry_index.css': 'demo.subapp.com_assets_entry_index-b1b84a61e3af03bdad8f.css',
            'demo.subapp.com_assets_entry_index.js': 'demo.subapp.com_assets_entry_index-b1b84a61e3af03bdad8f.js',
            'demo.subapp.com_assets_entry_subdir_index.css': 'demo.subapp.com_assets_entry_subdir_index-909add3df7d3c2f0b1c1.css',
            'demo.subapp.com_assets_entry_subdir_index.js': 'demo.subapp.com_assets_entry_subdir_index-909add3df7d3c2f0b1c1.js',
            'demo.subapp.com_assets_index.entry.js': 'demo.subapp.com_assets_index.entry-dfdd48072847fbcc73c4.js',
            'second.subapp.com_assets_entry_index.css': 'second.subapp.com_assets_entry_index-dd699a9240c82616d13c.css',
            'second.subapp.com_assets_entry_index.js': 'second.subapp.com_assets_entry_index-dd699a9240c82616d13c.js',
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
