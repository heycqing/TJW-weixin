# TJW Weixin

这是一个早期的微信公众号后台项目。当前第一阶段不是迁移完整业务，而是验证：

> 微信公众号后台是否可以稳定访问 Cloudflare Worker 自定义域名。

POC 只实现 `/wechat`：

- `GET /wechat`：按微信公众号规则校验 `signature/timestamp/nonce`，成功后返回 `echostr`。
- `POST /wechat`：校验签名后解析微信 XML，并返回一段简单 XML 文本，证明消息回调可达。

旧的 Koa/MySQL 业务代码暂时保留，后续验证通过后再迁移状态机和数据层。

## 本地准备

安装依赖：

```bash
npm install
```

配置本地密钥：

```bash
copy .env.example .env
copy .dev.vars.example .dev.vars
```

`.env` 用于旧 Node/Koa 代码，`.dev.vars` 用于 `wrangler dev` 本地运行 Cloudflare Worker。当前 POC 只需要 `WECHAT_TOKEN`；`WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 是为后续调用微信接口预留的。

把下面三项替换成你自己的微信公众号后台配置：

```text
WECHAT_APP_ID=你的公众号 AppID
WECHAT_APP_SECRET=你的公众号 AppSecret
WECHAT_TOKEN=你在微信后台服务器配置里填写的 Token
```

如果还要运行旧 MySQL 业务代码，也需要在 `.env` 里填写 `MYSQL_HOST`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE`。这些真实配置文件已被 `.gitignore` 忽略，不要提交到仓库。

运行测试：

```bash
npm test
```

本地启动 Worker：

```bash
npm run dev
```

本地模拟微信 GET 验证时，需要按 `token/timestamp/nonce` 生成 SHA-1 签名。测试里使用的固定值是：

- `token`: `test-token`
- `timestamp`: `1523204100`
- `nonce`: `abc123`
- `signature`: `57010dd0485727a0ffb6f989b4a32b49cdde38ca`

示例：

```bash
curl "http://127.0.0.1:8787/wechat?signature=57010dd0485727a0ffb6f989b4a32b49cdde38ca&timestamp=1523204100&nonce=abc123&echostr=hello-worker"
```

如果返回 `hello-worker`，说明验签逻辑正常。

## Cloudflare 部署验证

1. 登录 Cloudflare，并准备一个已接入 Cloudflare DNS 的域名。
2. 复制示例配置：

```bash
copy wrangler.toml.example wrangler.toml
```

3. 修改 `wrangler.toml`，把示例域名替换成自己的域名。`custom_domain` 绑定 hostname，不带 `/wechat` 路径；路径由 Worker 内部判断，例如：

```toml
routes = [
  { pattern = "wx.example.com", custom_domain = true }
]
```

4. 设置微信公众号 Token。Token 必须和微信后台填写的 Token 完全一致：

```bash
npx wrangler secret put WECHAT_TOKEN
```

如果后续 Worker 需要调用微信接口获取 `access_token`，再继续设置：

```bash
npx wrangler secret put WECHAT_APP_ID
npx wrangler secret put WECHAT_APP_SECRET
```

5. 部署：

```bash
npm run deploy
```

6. 在微信公众号后台的“服务器配置”里填写：

```text
URL: https://wx.example.com/wechat
Token: 与 WECHAT_TOKEN 相同
EncodingAESKey: 可随机生成
消息加解密方式: 明文模式
```

7. 点击提交/验证。成功标准：

- 微信后台验证通过。
- Cloudflare Worker logs 能看到微信发来的 GET 请求。
- 没有 403、证书错误或超时。

## 失败回退方案

如果微信后台无法稳定访问 Cloudflare Worker 自定义域名，保留两条低成本回退路线：

- 国内轻量云服务器 + Nginx + PM2：最接近旧部署方式，稳定性可控。
- 国内云函数/Serverless：保留按量付费和低运维优势，但需要重新适配函数入口。

验证通过后，下一阶段再做完整迁移：

- 用 D1 替代旧 MySQL。
- 整理微信交互状态机。
- 修复并发匹配问题。
- 移除源码里的微信密钥和数据库密码。
