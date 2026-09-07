# 本地核心验证记录

日期：2026-09-07。环境：Windows、Node.js 24.19.0、pnpm 11.19.0。

## 已完成

- 默认文档来源改为公开仓库 `https://github.com/Azincc/nimbus-docs-template.git` 的 `main` 分支，使用本仓库 `docs/` 与 `docs/site.json`。
- `docs/` 提供模板首页、快速开始、Markdown 编写和站点配置示例；站点品牌资源位于 `docs/assets/`。
- `node --test tests/*.test.mjs`：15 项通过，覆盖普通 Markdown/frontmatter、首页与目录路由、链接和锚点、跨目录资源、增删同步、配置转换、凭据隔离与产物检查。
- 工作区示例通过现有 `prepareContent`、`prepareSiteConfig` 的文档、链接、资源及 JSON 校验，再完成 Astro 静态构建和 Pagefind 索引。生成 4 篇文档和 404 页面；此次本地预检元数据标为 `working-tree`，不冒充远端提交。
- 对当前源码和文档进行了旧示例引用核对，配置、测试及示例内容已统一为本仓库。

完整构建会拉取远端已推送的文档，而不是工作区中未提交的 `docs/`。构建产物的 `/_build.json` 和页脚记录文档来源 SHA，可与远端提交核对。

## 尚未验证

本轮按用户指定只进行本地实现与核心验证。以下需要真实 GitHub/Cloudflare 账户与配置：

- 部署按钮表单变量在首次构建中的实际时序。按钮已配置为指向 `https://github.com/Azincc/nimbus-docs-template`，这不代表已完成 Cloudflare 部署验收。
- 私有仓库真实 Token 作为 Cloudflare Build Secret 的读取。已验证本地隔离逻辑，但未使用真实私有凭据。
- GitHub Webhook → Cloudflare Deploy Hook 自动重建与线上文档增删。
- 构建失败时上一版线上站点持续可用。

步骤和平台证据边界见 [README](../README.md) 与 [平台核对记录](platform-notes.md)。
