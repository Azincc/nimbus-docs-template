# 本地核心验证记录

日期：2026-09-07。环境：Windows、Node.js 24.19.0、pnpm 11.19.0。

## 已完成

- 完整执行 `node scripts/build.mjs`：从公开仓库 `https://github.com/Azincc/echo` 拉取 `main`，同步 `gitbook` 并完成 Nimbus 静态构建和 Pagefind 索引。
- 实际文档提交：`900d488596663b7fb2c620013f03ffb5417ae95c`。生成三篇文档、404 页面和引用资源；`/_build.json` 与页脚记录对应 SHA。
- `node --test tests/*.test.mjs`：15 项通过，覆盖普通 Markdown/frontmatter、首页与目录路由、链接和锚点、跨目录资源、增删同步、配置转换、凭据隔离与产物检查。
- `astro check`：112 个文件，0 errors、0 warnings、0 hints。
- Wrangler 4.129.0 本地 Static Assets：首页、两篇子文档、两张登录截图、搜索脚本、构建元数据均返回 HTTP 200；不存在的路径返回 HTTP 404。
- 浏览器中检查首页、侧栏和目录；搜索 `Navidrome` 返回三篇真实文档及章节链接。
- `node scripts/deploy.mjs --dry-run`：成功读取 86 个静态资产并完成本地发布检查，未执行云端部署。
- 失败的构建没有发布就绪标记；实际运行发布脚本时拒绝启动 Wrangler。另用单元测试检查产物修改、改名、删除会改变摘要，以及凭据被禁止写入产物。
- Git 拉取遇到过本机间歇性连接失败；成功重试后完整流水线通过。拉取设置五分钟上限，超时会清理其子进程和临时目录。

## 尚未验证

本轮按用户指定只进行本地实现与核心验证。以下需要真实 GitHub/Cloudflare 账户与配置：

- 部署按钮表单变量在首次构建中的实际时序。按钮已配置为指向 `https://github.com/Azincc/nimbus-docs-template`，这不代表已完成 Cloudflare 部署验收。
- 私有仓库真实 Token 作为 Cloudflare Build Secret 的读取。已验证本地隔离逻辑，但未使用真实私有凭据。
- GitHub Webhook → Cloudflare Deploy Hook 自动重建与线上文档增删。
- 构建失败时上一版线上站点持续可用。

步骤和平台证据边界见 [README](../README.md) 与 [平台核对记录](platform-notes.md)。
