# Cloudflare 平台核对记录

核对日期：2026-09-07。本文记录官方文档结论与实现建议，**不代表已经完成 Cloudflare 账户内的一键部署、私有仓库或 Webhook 实测**。

## 首次构建：目前能确定什么

| 项目 | 官方资料能确认的行为 | 本项目的处理方式 |
| --- | --- | --- |
| 部署按钮 | 将公开模板复制到用户的 GitHub/GitLab 新仓库，配置 Workers Builds 并构建部署 | 模板作者须先发布公开模板仓库，按钮 URL 指向该仓库 |
| `package.json` 的 `build`、`deploy` | 自动识别并预填部署界面的相应命令 | 分别提供完整构建和发布命令；保留在界面核对的步骤 |
| Wrangler `vars` | 可以出现在部署按钮配置表单中，属于 Worker 环境变量 | 构建脚本可以主动读取仓库内 Wrangler 配置，作为公开配置的后备来源 |
| 按钮中的 Worker Secret | 支持 `.dev.vars.example` 或 `.env.example` 声明；官方描述为 Worker secrets | 不能据此假设它出现在构建进程 `process.env` 中 |
| Build variables and secrets | 只提供给构建；与运行时 `Settings → Variables & Secrets` 分开 | 私有文档读取 Token 在这里设为 Secret；同步脚本从 `process.env.DOCS_TOKEN` 读取 |
| 表单修改的 `vars` 是否在首次 build 前写入 Wrangler 文件 | 官方页面没有给出这个具体时序保证 | 属于需要云端最小原型验证的优化，不能标记“已验证一键完成” |

### 配置回写的原文与证明边界

[Deploy buttons 文档](https://developers.cloudflare.com/workers/platform/deploy-buttons/)（页面更新于 2026-07-22）描述：

> Your users can customize key details such as repository name, Worker name, and required resource names in a single setup page with customizations reflected in the newly created Git repository.

资源配置段另有：

> During deployment, Cloudflare will provision any necessary resources and update the Wrangler configuration where applicable for newly created resources (e.g. database IDs and namespace IDs).

这能证明平台支持将部分模板定制写入新仓库，不能单独证明 `vars` 的新值在**首次 build 命令开始前**已经写入。Worker environment variables and secrets 段只给出声明格式，也没有承诺将这些值导出给构建进程。

[Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)（页面更新于 2026-08-28）明确：

> Add environment variables and secrets accessible only to your build. Build variables will not be accessible at runtime. If you would like to configure runtime variables you can do so in Settings > Variables & Secrets.

因此不要依赖作用域自动互通。由模板自己的构建脚本读取已经存在于 Git 检出目录中的公开 `vars` 是独立的本地实现；它是否恰好能接住按钮表单的首次定制值仍需实测。

### 可落地的配置约定

- 公开值优先级：显式构建环境变量 → 模板仓库内的公开配置默认值。
- `DOCS_REPO`、`DOCS_BRANCH`、`DOCS_PATH`、`DOCS_CONFIG_PATH`、`SITE_URL` 可以放在 Wrangler `vars` 中，用于按钮显示和本地读取；用户也可以在 Build variables 中覆盖。
- `DOCS_TOKEN` 只从构建环境读取，不从 `vars`、站点 JSON 配置或带凭据的仓库 URL 读取。不要把它声明为所有用户必填的运行时 Secret。
- 不配置 `secrets.required: ["DOCS_TOKEN"]`。该功能验证的是 Worker 必需 Secret，不是构建 Secret；公开仓库也不应被迫提供 Token。
- 为公开仓库提供可运行的默认示例；不要用静默回退到示例站点掩盖用户所填文档源拉取失败。
- 当用户明确指定的仓库拉取失败，构建应以非零状态结束，并提示检查仓库、分支、路径与 Build Secret。发布命令不能继续运行。

`secrets.required` 的作用域依据：[Declare required secrets in your Wrangler configuration](https://developers.cloudflare.com/changelog/post/2026-03-24-secrets-config-property/)。该功能会在 `wrangler deploy` 和 `wrangler versions upload` 时检查目标 Worker 是否配置了必需 Secret，并不会自动创建构建 Secret。

## 用户步骤：公开源与私有源

### 公开文档源

目标最短路径是：点击公开模板的部署按钮 → 填写公开文档源配置并确认构建命令 → 首次构建 → 创建 Deploy Hook → 原文档仓库添加 push Webhook。

上述路径中，**“任意表单源配置能进入首次 build”尚待云端验证**。在这项验证完成前，应同时提供可确定的补充操作：在 Worker 的 Builds 设置中添加对应 Build variables，然后重试构建；也可以先在用户自己的模板仓库修改公开配置再构建。这些操作均不要求本地 Node 或脚手架。

Workers Builds 文档说明保存的构建配置用于下次构建；重试构建时使用**重试时现有的构建配置**，因此“保存 Build variables/Secret 后重试”是有文档支持的恢复流程。

### 私有文档源

私有的是原文档仓库，供部署按钮读取的模板仓库仍须公开。

1. 在 GitHub 创建只读目标文档仓库内容的 Token（优先选择限定目标仓库、Contents: Read-only 的 fine-grained PAT）。
2. 在 Cloudflare 的 **Worker → Settings → Builds → Build variables and secrets** 添加 `DOCS_TOKEN`，类型选择 Secret；同时在这里确认公开文档源配置。
3. 保存并重试构建。如果当前创建界面提供该构建 Secret 区域，可以在第一次构建前配置；不要将普通 Worker Secret 表单误认为这个区域。
4. 首次成功构建后，再按公开源相同流程配置 Deploy Hook 和 GitHub push Webhook。

若用户只能在按钮创建 Worker 之后进入该设置页，首次私有读取会失败，补上构建 Secret 后重试是目前文档可支持的明确额外步骤。不要宣传私有源已经能在按钮一个表单中完成首次构建。

## 构建命令识别与发布边界

[Deploy buttons 文档](https://developers.cloudflare.com/workers/platform/deploy-buttons/#best-practices)原文：

> If you are using custom `build` and `deploy` scripts in your `package.json` ... Cloudflare will automatically detect and pre-populate the build and deploy fields.

没有 `deploy` 脚本时，默认是 `npx wrangler deploy`；没有 `build` 脚本时，构建命令为空。可以使用这样的分工：

```json
{
  "scripts": {
    "build": "node scripts/build.mjs",
    "deploy": "node scripts/deploy.mjs"
  }
}
```

这里是分工示意，以项目最终实际脚本为准。若搜索索引需要单独构建，必须包含在 `build` 中。

Workers Builds 先运行 build command，再运行 deploy command。固定 `package.json` 的 Wrangler 版本并提交依赖锁文件；Builds 文档确认采用项目 `package.json` 中指定的 Wrangler 版本。不要只把构建放进 Wrangler 的 Custom Builds 配置：当前 Builds 文档注明其不遵从该配置，应显式提供构建命令。

这一顺序保证构建失败时不会执行本次发布。上一版线上站点持续可用仍应在真实部署中做一次核心验证，不将本地失败测试表述为线上实测。

## Deploy Hook 与 GitHub Webhook

[Deploy Hooks 文档](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)（页面更新于 2026-04-23）确认：

- 先把 Worker 关联到 Git 仓库，再进入 **Settings → Builds → Deploy Hooks**，输入名称并选择分支。
- 对生成的 URL 发 HTTP POST 即触发该分支的手动构建，不要求 `Authorization` 请求头，URL 内唯一标识就是触发凭据。
- Hook 关联的是 Cloudflare 已连接的**模板仓库分支**；`DOCS_BRANCH` 是构建脚本读取的**原文档仓库分支**，二者独立。
- GitHub 原仓库 Webhook 的 Payload URL 使用 Hook URL，Content type 使用 `application/json`，事件选择 `Just the push event`。无须自建 Worker 接收器。
- GitHub 仓库级 push 事件可能来自其他分支；本项目每次仍读取 `DOCS_BRANCH` 最新内容。Hook 不提供将外部 Webhook 的文档提交 SHA 自动注入构建的已记录接口，不能将 Cloudflare 模板提交 SHA 当作文档 SHA。
- Hook URL 不进入代码、公开配置或静态产物。由于不实现自定义签名验证，不要求用户在 GitHub Secret 字段填写一个本项目从未消费的签名 Secret。

官方去重边界也很明确：同一个 Hook 前一次构建处于 `queued` 或 `initializing` 时，重复 POST 返回已有 `build_uuid`，并带有 `already_exists: true`。前次构建离开 `initializing` 后，再次 POST 可以创建新构建。这不等于对全部正在运行的构建去重。

## Static Assets 与真实 404

[Static site generation](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)确认：`assets.not_found_handling: "404-page"` 会在找不到资产时返回最近的 `404.html`，HTTP 状态为 **404 Not Found**。

推荐资产配置：

```json
{
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  }
}
```

应确保 Nimbus/Astro 实际生成 `dist/404.html`。纯静态站点不需要 Worker `main`，也不需要 `ASSETS` 绑定；[迁移参考](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/#static-assets)说明，没有 Worker script 的资产配置应移除 `binding`。

不要使用 `single-page-application` 处理文档缺失页：该模式对未匹配请求返回 `index.html` 和 200，破坏真实 404。默认 `auto-trailing-slash` 会将 `folder/index.html` 映射到 `/folder/`；模板转换 Markdown 链接时应与最终输出路径保持一致。详见 [HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)。

## 仍需要在真实账户中完成的核心核对

1. 使用按钮把某个公开源的 `DOCS_REPO` / `DOCS_PATH` 改成不同于默认值，检查**首次 build**看到的值与新模板仓库实际配置，确认表单回写时机。
2. 确认 `build`、`deploy` 的预填命令，以及首次站点正文、导航、图片和 404。
3. 使用私有测试源，确认 Build Secret 在首次配置或补配重试后可用；日志与发布目录不包含 Token。
4. 给原文档仓库新增、修改、删除页面，经 GitHub Webhook → Deploy Hook 验证新站点及记录的文档 SHA。
5. 制造一次文档源读取或构建失败，确认没有发布新版本且旧站仍可访问。

这些是平台验收条件，不能用“官方文档已核对”或“本地 `astro build` 成功”替代。
