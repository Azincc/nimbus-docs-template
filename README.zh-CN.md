# Nimbus Docs Template

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Azincc/nimbus-docs-template)
<!-- deploy-button:end -->

[English](README.md) · [在线预览](https://nimbus.az1n.com)

这个模板使用 Nimbus、Astro 和 Cloudflare Workers，将 GitHub 仓库中的 Markdown 发布为文档网站。文档保留在原仓库，构建时自动拉取指定分支。

- 支持公开和私有 GitHub 文档源。
- 自动生成侧栏、页面目录、全文搜索和 Markdown 阅读入口。
- 支持主题切换、Logo、favicon、导航和 SEO 配置。
- 默认英文示例位于 `docs/`；完整[中文示例](docs-zh-CN/README.md)保留在 `docs-zh-CN/`。

## 快速部署

1. 点击 **Deploy to Cloudflare**，授权 GitHub，创建自己的模板仓库和 Worker。
2. 确认构建命令为 `pnpm run build`、部署命令为 `pnpm run deploy`，根目录为模板目录。
3. 打开 Worker 的 **设置（Settings）→ 构建（Builds）→ 变量和机密（Variables and secrets）**，按下表添加需要修改的变量。
4. 保存后，在构建记录中选择 **重试构建（Retry build）**。成功后，通过 Cloudflare 提供的 `workers.dev` 地址访问站点。

首次部署会发布本仓库的英文示例文档。要发布自己的文档，请填写 `DOCS_REPO`；复制模板不会自动修改这个值。构建变量可以随时修改，保存后重新构建即可生效。

## 构建变量

只需添加要修改的变量，其余使用下表中的默认值。**名称和值分开填写，值不加引号**。

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | 文档源仓库的 GitHub HTTPS 地址 |
| `DOCS_BRANCH` | `main` | 文档分支 |
| `DOCS_PATH` | `docs` | 相对文档源仓库根目录的文档路径 |
| `DOCS_CONFIG_PATH` | `docs/site.json` | 站点配置文件路径；没有此文件时添加变量并将值留空 |
| `SITE_URL` | `https://nimbus.az1n.com` | 自己的完整站点地址；暂不确定时添加变量并将值留空 |
| `SITE_LOGO` | 空 | Logo 的 HTTP(S) 图片地址或相对文档源仓库根目录的路径 |
| `SITE_FAVICON` | 空 | favicon 的 HTTP(S) 图片地址或相对文档源仓库根目录的路径 |

需要留空时，添加变量并清空值输入框，不要输入 `""`。如果没有添加变量，仍会使用模板默认值。请在 **构建** 设置中填写变量，普通 **Settings → Variables & Secrets** 中的运行时变量不会自动提供给构建。

`SITE_URL` 用于 SEO，设置它不会绑定域名。留空时网站仍可访问，但不生成依赖正式域名的 canonical 和 sitemap。`SITE_LOGO`、`SITE_FAVICON` 非空时覆盖 JSON 配置，留空则沿用 JSON。

### 选择中文示例

默认 `DOCS_REPO` 的 `docs/` 提供英文文档。要发布中文示例，在 **构建 → 变量和机密** 中同时设置：

| 变量 | 中文示例值 |
| --- | --- |
| `DOCS_PATH` | `docs-zh-CN` |
| `DOCS_CONFIG_PATH` | `docs-zh-CN/site.json` |

文档仓库和 `main` 分支保持默认，保存后重新构建即可。路径从 `DOCS_REPO` 的根目录算起；使用自己的文档源时，填写实际目录。切换文档语言不会改变模板代码的来源。

### 私有文档源

在同一个 **构建 → 变量和机密** 区域添加 `DOCS_TOKEN`，类型选择 **Secret**。GitHub Token 应只授权目标仓库，并授予 **Contents: Read-only** 权限。Token 只用于 Git 拉取，不要写入仓库、URL 或普通变量。**私有仓库中的文档仍会发布为公开网站。** 详见[私有仓库部署](docs-zh-CN/deployment/private-repository.md)。

文档和模板位于同一构建仓库、同一分支时，推送会触发构建。使用独立文档源时，按[构建挂钩指南](docs-zh-CN/deployment/deploy-hook.md)设置推送后的自动构建。

## 本地运行

准备 Git、Node.js 22.12.0 或更新版本，以及 pnpm 10.2.0：

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

也可使用 npm：运行 `npm ci`，再运行 `npm run dev`。后续命令将 `pnpm <命令>` 换为 `npm run <命令>`。

开发和生产构建都需要联网，从配置的远程仓库拉取文档。构建读取哪个目录由 `DOCS_PATH` 决定。修改本地英文 `docs/` 或中文 `docs-zh-CN/` 后，需要先推送到配置的文档源分支，再重新运行命令。

```sh
pnpm build
pnpm preview:cf
```

确认构建产物后，运行 `pnpm deploy` 发布到 Cloudflare。部署需要 Cloudflare 授权，脚本只接受本次成功构建且未被修改的产物。

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
