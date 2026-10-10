# 本次工作区验证（2026-10-10）

环境：Node.js 24.19.0；Chromium；隔离测试上下文与临时浏览器目录。测试中填写的文字仅是自动化夹具，不是用户记录；输出位于 Git 忽略的 test-results/。

## 通过

- `npm test`：30 项单元测试，覆盖日期/连续记录、习惯、学习积分、备份兼容、自定目标、资料链接安全和归一化。
- `npm run build:offline`：Vite 生产构建成功，生成 dist/、约 367 KiB 的单文件 HTML 及 `.local/qingxing-offline.zip`。
- `npm run test:e2e`：14 项浏览器流程通过，包括打卡修改、刷新持久化、导出、计时暂停/完成、跨日、提醒、手机导航与重置确认。
- `npm run test:resources`：资料空状态、危险链接拒绝、添加/刷新/分类/删除、自定目标、短句开关持久化、备份字段、暂停计时与手机布局通过；无外部网络请求及页面错误。
- 本机 HTTP 加载离线单文件后断网，`BASE_URL='http://127.0.0.1:4175/清醒-本地学习版.html' npm run test:offline`：13 项流程通过，含完整关闭和重新打开 Chromium 后持久保存；无外部 HTTP 请求或浏览器错误。
- 已查看桌面和 390px 手机资料目录截图；手机 DOM 宽度检查无水平溢出。截图在 `test-results/resources-desktop.png`、`test-results/resources-mobile.png`。
- `git diff --check` 通过。

## 受限或未执行

- 直接 `file://` 打开离线 HTML：尝试被云环境策略 `ERR_BLOCKED_BY_ADMINISTRATOR` 拦截，未验证通过。上述 HTTP 断网测试不能替代这项验证。可在本机用 README 的回环地址服务方式运行。
- 百度贴吧/“戒色吧”外部获取：等待需求确认，本版未实现、未抓取。
- 未测试 Safari/Firefox 或原生移动设备；只做 Chromium 响应式验证。
- 本版本只发布源码与离线分发文件，不部署网站。旧 DEPLOYMENT.md 不属于本次分发内容。
