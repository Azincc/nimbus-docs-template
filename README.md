# nimbus-template

把现有 GitHub 仓库中的 Markdown 文档发布为 Nimbus 文档网站。文档留在原仓库维护；Cloudflare Workers Builds 拉取指定分支、准备文档并构建，Wrangler 将 `dist/` 发布到 Workers Static Assets。

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FAzincc%2Fnimbus-docs-template)
<!-- deploy-button:end -->

部署用户不需要本地安装 Node 或运行脚手架。模板预置了 Nimbus 的页面、布局、组件和样式，支持 Markdown 标题补全、相对文档链接、仓库内引用图片、自动导航、搜索和真实 404。

> 当前工作范围是本地实现和核心验证。部署按钮表单的公开配置是否在首次 build 前写回仓库、私有仓库 Build Secret、真实 GitHub Webhook 和线上发布仍需在 Cloudflare 账户中验收。本文明确列出补配步骤，不把平台文档结论当作云端实测结果。

## 最少部署步骤

### 1. 部署模板并选择文档源

点击上方 **Deploy to Cloudflare**，完成 Cloudflare 与 GitHub 授权。Cloudflare 将公开模板复制到你自己的新仓库，并把 Worker 的 Builds 关联到这个新仓库。

模板支持将站点源码与文档来源分开维护：

| 仓库 | 维护的内容 | 用途 |
| --- | --- | --- |
| 你的模板仓库 | 本模板源码、依赖、Wrangler 配置 | Cloudflare Builds 关联并构建它 |
| 原文档仓库 | Markdown、图片和可选站点 JSON 配置 | 每次构建时读取它的最新内容 |

默认示例直接使用 [本仓库的 docs 目录](docs/README.md)，无需准备另一个文档仓库：

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | GitHub 仓库 HTTPS 地址，不包含 Token |
| `DOCS_BRANCH` | `main` | 原文档仓库分支名 |
| `DOCS_PATH` | `docs` | 仓库内文档目录 |
| `DOCS_CONFIG_PATH` | `docs/site.json` | 示例站点配置，相对仓库根目录；可置空使用通用配置 |
| `SITE_URL` | 空 | 可选站点正式公开地址，例如 `https://docs.example.com` |

这些公开默认值位于 `wrangler.jsonc` 的 `vars`。构建时同名 **Build variables** 优先；直接修改你自己的模板仓库里的默认值也会用于后续构建。

克隆模板后，默认仍读取上述公开仓库。要发布自己副本里的文档，将 `DOCS_REPO` 改为自己的仓库地址，保留 `DOCS_PATH=docs` 和 `DOCS_CONFIG_PATH=docs/site.json`。如果换用其他结构的文档仓库，请同时调整目录和配置文件路径；没有站点 JSON 时将 `DOCS_CONFIG_PATH` 置空。

示例包含首页、[快速开始](docs/getting-started.md)、[编写文档](docs/writing-docs.md)、[站点配置](docs/site-config.md)，以及被文档和站点配置共同引用的品牌图片。`maintenance/` 保存平台研究和验证记录，不进入示例站点。

在部署界面填写文档源，并确认预填命令：

- Build command：`pnpm run build`
- Deploy command：`pnpm run deploy`
- Root directory：仓库根目录

官方部署按钮会识别 `package.json` 中的 `build` 和 `deploy`。但官方尚未明确承诺表单中的 Worker `vars` 在首次构建开始前回写：**当前没有对这项时序完成云端实测**。如果首次构建读取不到填写的配置，或仍读到默认示例，进入 **Worker → Settings → Builds → Build variables and secrets**，填写上述文档源配置，保存并 **Retry build**。重试会使用保存后的构建配置。

私有原文档仓库还需要一个步骤：在同一处添加名为 `DOCS_TOKEN` 的 **构建 Secret**，使用仅可读取目标仓库内容的 GitHub Token。优先使用限定目标仓库且 `Contents: Read-only` 的 fine-grained PAT。若初始界面提供 Build variables and secrets，可在首次构建前填写；若只能在创建 Worker 后进入，则补配后重试首次失败的构建。

普通 **Settings → Variables & Secrets** 中的 Worker Secret 与构建 Secret 不同。公开仓库可以完全不填 Token；`DOCS_TOKEN` 不应写入 `vars`、仓库 URL、站点 JSON 或提交的环境文件。

首次构建不需要 Webhook。成功后，使用 Cloudflare 提供的 `workers.dev` 地址访问站点。页面页脚及 `/_build.json` 记录实际使用的**文档提交 SHA**。

### 2. 创建 Cloudflare Deploy Hook

将文档与模板放在同一个 Builds 关联仓库、同一个分支时，提交即可触发该仓库的自动构建，无需额外 Webhook。使用独立文档源时，再完成下面两步。

进入 **Workers & Pages → 目标 Worker → Settings → Builds → Deploy Hooks**，创建一个挂钩，选择**模板仓库的构建分支**（通常为 `main`），复制生成的 URL。

### 3. 在原文档仓库添加 GitHub Webhook

进入**原文档仓库**的 **Settings → Webhooks → Add webhook**：

| 字段 | 值 |
| --- | --- |
| Payload URL | 上一步复制的 Cloudflare Deploy Hook URL |
| Content type | `application/json` |
| Secret | 留空；该流程使用 Deploy Hook URL 作为触发凭据 |
| Events | `Just the push event` |

保存后，原文档仓库的 push 会通过 GitHub 直接调用 Cloudflare Deploy Hook 并触发重建。挂钩 URL 本身就是凭据，只保存在 Webhook 设置等需要它的位置，不放入公开仓库。

Hook 选择的模板分支与 `DOCS_BRANCH` 是独立配置。其他原文档分支的 push 也可能触发额外构建，但构建仍读取 `DOCS_BRANCH` 的最新内容。外部 Webhook 的提交 SHA 不会自动作为文档构建版本传入；本模板会自己记录实际拉取的 SHA。

Cloudflare 仅对同一 Hook 前一次构建仍处于 `queued` 或 `initializing` 的重复请求返回已有构建。构建已经运行后，后续请求仍可能创建新构建。

## 文档与站点配置

原文档无需预先补 frontmatter。模板会从首个 Markdown 标题提取页面标题，并保留已有的有效 frontmatter。

- 文档根目录的 `README.md` 或 `index.md` 对应站点首页 `/`；子目录同名文件对应目录首页。同一目录不能同时有这两种首页文件。
- 若文档根目录没有首页文件，模板生成目录首页，方便访问自动发现的文档。
- `.md` 相对链接转换到生成后的页面路由；引用的锚点保留。
- 相对图片与文件可以位于文档目录之外，但必须仍在原文档仓库内。默认示例的 `docs/README.md` 引用 `./assets/nimbus-mark.svg`，构建会自动复制该图片。
- 每次重新生成文档和引用资源，删除源文档后不会保留旧的生成页面。
- 文档来源第一版支持 `.md`，不执行来源仓库中的 MDX 或任意 Astro/JavaScript 配置。

无效的本地文档或资源引用会阻止构建，便于在发布前修复。文档目录之外的 `.md` 不会成为本站页面，链接到它们时使用完整 GitHub URL。

需要修改站点名称、介绍、顶部导航、主题或品牌资源时，在原文档仓库提交站点 JSON，并设置 `DOCS_CONFIG_PATH`。字段、示例和 frontmatter 写法见 [站点配置](docs/site-config.md)。这是模板实现的受校验 JSON 格式，不是 Nimbus 原生任意配置接口。

`SITE_URL` 留空时站点可以正常浏览，模板不生成 canonical、依赖绝对站点地址的 SEO 输出和 sitemap。绑定正式域名后，将 `SITE_URL` 设置为实际公开地址并重新构建。

## 模板作者的一次性准备

本项目基于官方 `@cloudflare/create-nimbus-docs@0.7.2`、`templates-v0.7.2` 的 static empty 模板生成，保留了可独立构建所需的可见源码，并集成远程文档准备流程。当前部署按钮指向 [Azincc/nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template)。

1. 将本项目发布到你控制的公开 GitHub 仓库。
2. 将下面命令中的示例路径替换为真实模板仓库地址，生成 README 部署按钮：

   ```sh
   node scripts/configure-template.mjs https://github.com/Azincc/nimbus-docs-template.git
   ```

3. 提交更新后的 README 和依赖锁文件，使按钮指向包含完整模板的公开仓库。

命令替换 `deploy-button:start` 与 `deploy-button:end` 之间的内容。将模板迁移到其他仓库时运行此命令更新按钮。发布模板不需要创建版本 tag。

## 本地开发

本地开发使用 Node.js `24.19.0`、pnpm `11.19.0`，并安装 Git。应用依赖固定为 Nimbus `0.13.0`、Astro `7.0.9`、Wrangler `4.129.0`，提交了 `pnpm-lock.yaml`。

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm preview:cf
```

默认构建读取本仓库 `main` 分支上的 `docs/`，需要网络访问 GitHub。本地修改示例文档后先提交并推送，再运行构建；构建始终以配置分支的最新已提交内容为准。修改 `wrangler.jsonc` 中的公开默认值，或通过 shell 环境变量指定其他来源。不要把 Token 写入公开配置；构建脚本从进程环境读取 `DOCS_TOKEN`。

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 准备文档并启动本地开发服务器 |
| `pnpm build` | 拉取文档、转换资源并构建完整静态站点及搜索索引 |
| `pnpm deploy` | 发布成功构建的静态产物到 Cloudflare，需要部署身份 |
| `pnpm preview:cf` | 使用 Wrangler 在本地预览 `dist/` 与 Workers Static Assets 路由 |
| `pnpm config:probe` | 检查构建配置来自环境变量还是仓库默认值，用于首次部署原型核对 |
| `pnpm test` | 运行文档同步与配置的核心测试 |
| `pnpm typecheck` | 运行 Astro/TypeScript 检查 |

本地开发服务器不会接收远程文档仓库的 push。文档源修改后重新运行准备/构建命令；线上通过 Builds 完成同一流程。

## 发布与验收边界

默认示例和核心测试均使用本项目的文档结构，验证范围和记录见 [本地核心验证记录](maintenance/validation.md)。

构建先拉取来源，再准备文档并运行 Nimbus；只有构建成功后才进入 Wrangler 发布。拉取、配置校验或构建失败应在构建日志中明确报错，本次不发布新站点。内容 SHA 记录属于原文档仓库，不应与 Cloudflare 显示的模板仓库 SHA 混淆。

本轮只处理本地实现和必要的核心验证。以下云端项目尚待真实账户验收：

- 部署按钮修改后的公开配置在首次构建中的读取，以及文档、导航和图片的线上访问。
- GitHub Webhook → Deploy Hook 自动更新；新增和删除文档后的页面与导航变化。
- 原文档仓库读取或构建失败时，上一版线上站点继续可用。
- 私有文档读取凭据进入构建，且不出现在构建日志或静态产物中。

本地构建和测试不能替代以上云端验收。更完整的性能、无障碍、多平台及长期运行测试由使用者决定范围。

平台原文、首次构建变量时序的证据边界和后续验收要点见 [平台核对记录](maintenance/platform-notes.md)。

## 官方参考

- [Nimbus](https://github.com/cloudflare/nimbus)
- [Nimbus 脚手架](https://github.com/cloudflare/nimbus/tree/main/packages/create-nimbus-docs)
- [Deploy to Cloudflare 按钮](https://developers.cloudflare.com/workers/platform/deploy-buttons/)
- [Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Workers Builds Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
