# Nimbus Docs Template

将 GitHub 仓库中的 Markdown 发布为文档网站，基于 Nimbus、Astro 和 Cloudflare Workers。文档可保留在原仓库，每次构建自动拉取指定分支。

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FAzincc%2Fnimbus-docs-template)
<!-- deploy-button:end -->

- 支持公开和私有 GitHub 文档源。
- 自动生成侧栏、页面目录、全文搜索和 Markdown 阅读入口。
- 支持主题切换、Logo、favicon、站点导航和 SEO 配置。
- 本仓库的 [docs/](docs/README.md) 即为完整示例。

## 快速部署

无需安装开发工具或编辑配置文件，直接在 Cloudflare 页面填写参数即可。

1. 点击 **Deploy to Cloudflare**，授权 GitHub，创建自己的模板仓库和 Worker。
2. 确认构建命令为 `pnpm run build`、部署命令为 `pnpm run deploy`，根目录为仓库根目录。
3. 打开该 Worker 的 **设置（Settings）→ 构建（Builds）→ 变量和机密（Variables and secrets）**，点击 **添加**，按下表填写自己的文档仓库等参数。以后在同一位置修改对应的值即可。
4. 保存后，进入构建记录，对最新一次构建选择 **重试构建（Retry build）**。构建成功后，通过 Cloudflare 提供的 `workers.dev` 地址访问站点。

首次部署可能先显示本仓库的示例文档；构建变量列表为空时，也会使用模板默认值。复制模板不会自动将 `DOCS_REPO` 改成你的仓库地址，发布自己的文档时需要填写它。

## 构建变量

以下 7 项都可以在上述位置设为普通变量。**名称和值分开填写，值不加引号**。例如名称填 `DOCS_BRANCH`，值填 `main`。只添加需要修改的项，未添加的项使用下表默认值。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | 改成存放自己文档的 GitHub 仓库 HTTPS 地址 |
| `DOCS_BRANCH` | `main` | 文档分支 |
| `DOCS_PATH` | `docs` | 相对文档源仓库根目录的文档路径 |
| `DOCS_CONFIG_PATH` | `docs/site.json` | 站点配置文件路径；没有此文件时添加此变量并将值留空 |
| `SITE_URL` | `https://nimbus.az1n.com` | 改为自己的完整站点地址，如 `https://你的Worker.你的子域.workers.dev`；暂不确定时添加此变量并将值留空 |
| `SITE_LOGO` | 空 | Logo 的 HTTP(S) 图片地址或相对文档源仓库根目录的路径 |
| `SITE_FAVICON` | 空 | favicon 的 HTTP(S) 图片地址或相对文档源仓库根目录的路径 |

“将值留空”是清空输入框，**不要输入两个引号 `""`**。未添加变量会继承模板默认值，与添加后留空不同。参数可以随时编辑，保存后选择 **Retry build** 才会更新网站。详细步骤见[修改部署配置](docs/deployment/configuration.md)。

请确认进入的是 **构建** 区域中的变量和机密；普通 **Settings → Variables & Secrets** 中的运行时变量不会自动提供给构建。

`SITE_URL` 用于 SEO，不会绑定域名；置空仍可访问，但不生成依赖正式域名的 canonical 和 sitemap。`SITE_LOGO`、`SITE_FAVICON` 非空时覆盖 JSON 配置，留空则沿用 JSON。

较早创建的部署副本可能尚未支持 `SITE_LOGO` 和 `SITE_FAVICON`，需要先由模板维护者同步新版构建脚本；只添加变量不会自动升级副本。

公开文档仓库不需要机密。私有文档源还需在同一个 **构建 → 变量和机密** 区域添加 `DOCS_TOKEN`，类型选择 **Secret**，使用仅授权目标仓库、具有 **Contents: Read-only** 权限的 GitHub Token。不要把 Token 写入仓库文件或 URL。私有仓库中的文档默认仍会发布为公开网站。详见[私有仓库部署](docs/deployment/private-repository.md)。

文档和模板位于同一构建仓库、同一分支时，可通过推送触发自动构建。使用独立文档源时，按[构建挂钩指南](docs/deployment/deploy-hook.md)连接 GitHub Webhook 与 Cloudflare Deploy Hook。

## 本地运行

准备 Git、Node.js 24.19.0 和 pnpm 11.19.0：

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的地址即可预览。`pnpm dev` 和 `pnpm build` 都会从远程拉取文档；修改本地 `docs/` 后，需要先推送到配置的文档源分支，再重新运行命令。

| 命令 | 用途 |
| --- | --- |
| `pnpm build` | 构建静态页面与搜索索引 |
| `pnpm preview:cf` | 本地预览构建产物 |
| `pnpm deploy` | 将成功构建的产物发布到 Cloudflare，需部署授权 |
| `pnpm config:probe` | 查看构建配置及其来源 |
| `pnpm test` | 运行核心测试 |
| `pnpm typecheck` | 检查 Astro 与 TypeScript |

## 使用文档

| 文档 | 内容 |
| --- | --- |
| [快速入门](docs/getting-started.md) | 运行示例与部署流程 |
| [编写文档](docs/writing-docs.md) | 首页、目录、Markdown 链接与图片 |
| [侧栏顺序](docs/sidebar-order.md) | 页面和分类排序 |
| [站点配置](docs/site-config.md) | 标题、导航、主题与品牌资源 |
| [修改部署配置](docs/deployment/configuration.md) | 在 Cloudflare 页面填写和修改构建参数 |
| [私有仓库部署](docs/deployment/private-repository.md) | Token 授权与部署排障 |
| [构建挂钩](docs/deployment/deploy-hook.md) | 文档推送后自动更新 |
| [更新模板](docs/deployment/template-update.md) | GitHub 同步步骤与可复制的 Agent 更新提示词 |
| [Markdown 显示测试](docs/markdown测试/markdown显示测试.md) | 常见 Markdown 样式示例 |

## 项目信息

- **技术栈**：Nimbus 0.13.0、Astro 7.0.9、Tailwind CSS 4、Wrangler 4.129.0。
- **部署方式**：Cloudflare Workers Builds 构建，Workers Static Assets 托管。
- **文档格式**：普通 `.md`，可带 frontmatter；不执行文档源中的 MDX 或 JavaScript。
- **首页规则**：文档根目录的 `README.md` 或 `index.md` 对应 `/`；均不存在时自动生成文档索引。
- **版本追踪**：页脚与 `/_build.json` 显示实际读取的文档提交 SHA。
- **许可**：[MIT](LICENSE)；上游来源和模板适配见 [NOTICE.md](NOTICE.md)。

| 目录 | 用途 |
| --- | --- |
| `docs/` | 示例文档与站点配置 |
| `src/` | 页面、布局、组件和样式 |
| `scripts/` | 文档拉取、转换、构建和发布 |
| `tests/` | 核心测试 |
| `public/` | 静态资源 |

`src/content/docs/`、`public/_source/` 和 `dist/` 是生成目录，不在其中维护文档。迁移模板仓库时，运行 `node scripts/configure-template.mjs <仓库 HTTPS 地址>`，同步更新 README 和快速入门中的部署按钮。

已完成本地构建与核心验证；私有仓库认证和 Webhook 自动更新尚待云端实测。
