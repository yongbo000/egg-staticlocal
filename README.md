# egg-staticlocal

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-staticlocal.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-staticlocal
[travis-image]: https://img.shields.io/travis/yongbo000/egg-staticlocal.svg?style=flat-square
[travis-url]: https://travis-ci.org/yongbo000/egg-staticlocal
[codecov-image]: https://img.shields.io/codecov/c/github/yongbo000/egg-staticlocal.svg?style=flat-square
[codecov-url]: https://codecov.io/github/yongbo000/egg-staticlocal?branch=master
[david-image]: https://img.shields.io/david/yongbo000/egg-staticlocal.svg?style=flat-square
[david-url]: https://david-dm.org/yongbo000/egg-staticlocal
[snyk-image]: https://snyk.io/test/npm/egg-staticlocal/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-staticlocal
[download-image]: https://img.shields.io/npm/dm/egg-staticlocal.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-staticlocal

插件只在本地开发环境下启用。

## 原理

主要3个步骤：

1. agent里另起线程，用于起静态资源构建服务器
2. 添加前置转发middleware，将应用收到的静态资源请求转发到本地静态资源服务器
3. 由本地静态资源服务器完成构建，返回产物

## 发布阶段

插件内置了一个 `build` 脚本，在package添加

```json
{
  "scripts": {
    "build": "staticlocal-build"
  }
}
```

`npm run build` 会将资源构建到 `{baseDir}/dist/*`，而后自行发布到cdn即可。
且会生成 `{baseDir}/config/map.json`，prod环境下跑的时候会从这份文件里找对应的构建产物。
