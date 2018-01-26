# egg-staticlocal

> 插件只在本地开发环境下启用。

## 原理

主要3个步骤：

- 1. agent里另起线程，用于起静态资源构建服务器
- 2. 添加前置转发middleware，将应用收到的静态资源请求转发到本地静态资源服务器
- 3. 由本地静态资源服务器完成构建，返回产物

## 发布阶段

插件内置了一个 `build` 脚本，在package添加

```json
{
  "scripts": {
    build: "staticlocal-build"
  }
}
```

`npm run build` 会将资源构建到 `{baseDir}/dist/*`，而后自行发布到cdn即可。
且会生成 `{baseDir}/config/map.json`，prod环境下跑的时候会从这份文件里找对应的构建产物。
