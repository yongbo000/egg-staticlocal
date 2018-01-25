'use strict';

const mock = require('egg-mock');
const address = require('address');
const assert = require('assert');

describe('test/staticlocal.test.js', () => {
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
