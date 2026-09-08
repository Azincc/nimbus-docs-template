# Nimbus Docs Template

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Azincc/nimbus-docs-template)
<!-- deploy-button:end -->

[English](README.md) · [在线预览](https://nimbus.az1n.com)

将 GitHub 仓库中的 Markdown 发布为文档网站，基于 Nimbus、Astro 和 Cloudflare Workers。文档保留在原仓库，每次构建自动拉取指定分支。

- 支持公开和私有 GitHub 文档源。
- 自动生成侧栏、页面目录、全文搜索和 Markdown 阅读入口。
- 支持主题切换、Logo、favicon、导航和 SEO 配置。
- 默认英文示例位于 `docs/`；完整[中文示例](docs-zh-CN/README.md)保留在 `docs-zh-CN/`。

## 快速部署

1. 点击 **Deploy to Cloudflare**，授权 GitHub，创建自己的模板仓库和 Worker。
2. 确认构建命令为 `pnpm run build`、部署命令为 `pnpm run deploy`，根目录为模板目录。
3. 打开 Worker 的 **设置（Settings）→ 构建（Builds）→ 变量和机密（Variables and secrets）**，按下表添加需要修改的变量。
4. 保存后，在构建记录中选择 **重试构建（Retry build）**。成功后，通过 Cloudflare 提供的 `workers.dev` 地址访问站点。

首次部署使用本仓库的默认英文示例文档。复制模板不会自动更改 `DOCS_REPO`，发布自己的文档时需要填写它。构建变量可以随时修改；保存并重新构建后生效。

## 构建变量

以下变量均可选，只添加需要修改的项。**名称和值分开填写，值不加引号**。未添加的项使用默认值。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | 文档源仓库的 GitHub HTTPS 地址 |
| `DOCS_BRANCH` | `main` | 文档分支 |
| `DOCS_PATH` | `docs` | 相对文档源仓库根目录的文档路径 |
| `DOCS_CONFIG_PATH` | `docs/site.json` | 站点配置文件路径；没有此文件时添加变量并将值留空 |
| `SITE_URL` | `https://nimbus.az1n.com` | 自己的完整站点地址；暂不确定时添加变量并将值留空 |
| `SITE_LOGO` | 空 | Logo 的 HTTP(S) 图片地址或相对文档源仓库根目录的路径 |
| `SITE_FAVICON` | 空 | favicon 的 HTTP(S) 图片地址或相对文档源仓库根目录的路径 |

“留空”是清空输入框，不要输入 `""`。未添加变量会继承模板默认值，与添加后留空不同。请设置 **构建** 变量；普通 **Settings → Variables & Secrets** 中的运行时变量不会自动提供给构建。

`SITE_URL` 用于 SEO，不会绑定域名。置空仍可访问，但不生成依赖正式域名的 canonical 和 sitemap。`SITE_LOGO`、`SITE_FAVICON` 非空时覆盖 JSON 配置，留空则沿用 JSON。

### 选择中文示例

默认 `DOCS_REPO` 的 `docs/` 提供英文文档。要发布中文示例，在 **构建 → 变量和机密** 中同时设置：

| 变量 | 中文示例值 |
| --- | --- |
| `DOCS_PATH` | `docs-zh-CN` |
| `DOCS_CONFIG_PATH` | `docs-zh-CN/site.json` |

保留默认文档仓库和 `main` 分支，保存后重新构建。路径相对 `DOCS_REPO` 的根目录；模板代码来源不会因选择语言而改变。自己的文档源则填写实际目录。

### 私有文档源

在同一个 **构建 → 变量和机密** 区域添加 `DOCS_TOKEN`，类型选择 **Secret**。使用仅授权目标仓库、具有 **Contents: Read-only** 权限的 GitHub Token。Token 只用于 Git 拉取，不要写入仓库、URL 或普通变量。**私有仓库中的文档仍会发布为公开网站。** 详见[私有仓库部署](docs-zh-CN/deployment/private-repository.md)。

文档和模板位于同一构建仓库、同一分支时，推送会触发构建。使用独立文档源时，按[构建挂钩指南](docs-zh-CN/deployment/deploy-hook.md)连接自动更新。

## 本地运行

准备 Git、Node.js 22.12.0 或更新版本，以及 pnpm 10.2.0：

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

也可使用 npm：运行 `npm ci`，再运行 `npm run dev`。后续命令将 `pnpm <命令>` 换为 `npm run <命令>`。

开发和生产构建都会拉取配置的远程文档，需要网络连接。修改本地英文 `docs/` 或中文 `docs-zh-CN/` 后，先推送到配置的文档源分支，再重新运行命令；构建读取的目录由 `DOCS_PATH` 决定。

```sh
pnpm build
pnpm preview:cf
```

确认构建产物后，运行 `pnpm deploy` 发布到 Cloudflare；此步骤需要 Cloudflare 部署授权。部署脚本只接受本次成功构建且未被修改的产物。

| 命令 | 用途 |
| --- | --- |
| `pnpm build` | 构建静态页面与搜索索引 |
| `pnpm preview:cf` | 使用 Workers 本地预览构建产物 |
| `pnpm deploy` | 发布已构建的产物 |
| `pnpm config:probe` | 查看构建配置及其来源 |
| `pnpm test` | 运行核心测试 |
| `pnpm check` | 构建后检查 Astro 与 TypeScript，`typecheck` 为同义命令 |
| `pnpm e2e:dev --port 8787` | 启动已构建产物，供浏览器测试使用 |

## 文档与项目信息

[快速入门](docs-zh-CN/getting-started.md) · [编写文档](docs-zh-CN/writing-docs.md) · [侧栏顺序](docs-zh-CN/sidebar-order.md) · [站点配置](docs-zh-CN/site-config.md) · [修改部署配置](docs-zh-CN/deployment/configuration.md) · [更新模板](docs-zh-CN/deployment/template-update.md) · [Markdown 示例](docs-zh-CN/markdown测试/markdown显示测试.md)

- **技术栈**：Nimbus、Astro、Tailwind CSS、Workers Static Assets；具体版本见 [package.json](package.json)。
- **格式**：普通 `.md`，可带 frontmatter；不执行文档源中的 MDX 或 JavaScript。
- **首页**：文档根目录的 `README.md` 或 `index.md` 对应 `/`；均不存在时自动生成文档索引。
- **版本追踪**：页脚与 `/_build.json` 显示本次读取的文档提交 SHA。
- **目录**：`docs/` 为默认英文示例，`docs-zh-CN/` 为完整中文示例，`src/` 为站点界面，`scripts/` 为构建流程，`tests/` 为核心测试。
- **许可**：[MIT](LICENSE)；上游来源见 [NOTICE.md](NOTICE.md)。

`src/content/docs/`、`public/_source/` 和 `dist/` 是生成目录，不在其中维护文档。迁移模板仓库时，运行 `node scripts/configure-template.mjs <仓库 HTTPS 地址>` 更新部署按钮。
