---
title: 快速入门
description: 在 Cloudflare 控制台部署文档网站、填写构建参数，无需编写代码。
sidebar:
  label: 快速入门
  order: 10
---

在 Cloudflare 控制台即可完成部署和配置，无需安装开发工具或编辑代码。模板默认读取[示例仓库](https://github.com/Azincc/nimbus-docs-template.git) `main` 分支中的英文 `docs/`，部署后可以换成自己的文档仓库。

## 部署到 Cloudflare

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Azincc/nimbus-docs-template)
<!-- deploy-button:end -->

1. 点击上方 **Deploy to Cloudflare**，按提示授权 GitHub，创建自己的模板仓库和 Worker。
2. 确认构建命令为 `pnpm run build`、部署命令为 `pnpm run deploy`，根目录为仓库根目录。三个文档源字段保留示例预填值，或填写自己的公开仓库、分支和文档目录。
3. 开始部署。成功后，打开 Cloudflare 提供的 `workers.dev` 地址。

以后更换文档源、站点地址、Logo 或 favicon 时，打开该 Worker 的 **设置（Settings）→ 构建（Builds）→ 变量和机密（Variables and secrets）**，添加或修改对应变量，保存后在构建记录中选择 **重试构建（Retry build）**。

首次部署可能显示默认英文示例文档。如果控制台提示“未配置构建变量或密钥”，说明尚未添加参数，构建仍会读取模板默认值。复制模板不会自动把文档源改成你的仓库。

## 构建变量

首次 Cloudflare 部署表单只显示 `DOCS_REPO`、`DOCS_BRANCH`、`DOCS_PATH` 三项，每项都需要有值。体验示例时保留预填值即可；发布自己的文档时，改成实际文档源。

| 初次部署字段 | 预填值 | 如何填写 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | 改成自己的文档仓库 HTTPS 地址，如 `https://github.com/你的用户名/文档仓库.git` |
| `DOCS_BRANCH` | `main` | 文档所在的分支名称 |
| `DOCS_PATH` | `docs` | 仓库里的文档文件夹；文档在仓库根目录时填 `.` |

以下可选变量不会出现在首次部署表单，部署时无需填写。之后需要修改时，再到 **设置 → 构建 → 变量和机密** 添加。**名称和值填在各自的输入框中，值不加引号**。

| 可选变量 | 不设置时的行为 | 需要时如何填写 |
| --- | --- | --- |
| `DOCS_CONFIG_PATH` | 自动读取 `DOCS_PATH` 目录里的 `site.json`；没有文件时使用通用配置 | 配置文件位于其他位置时，填相对文档源仓库根目录的实际路径 |
| `SITE_URL` | 不指定正式站点地址 | 自己的完整站点地址，如 `https://你的Worker.你的子域.workers.dev` |
| `SITE_LOGO` | 沿用 JSON 中的 Logo，没有时使用内置 Nimbus Logo | Logo 的 HTTP(S) 图片地址，或仓库里的图片路径 |
| `SITE_FAVICON` | 沿用 JSON 中的 favicon，没有时使用内置 Nimbus Logo | 浏览器图标的 HTTP(S) 图片地址，或仓库里的图片路径 |

没有 `site.json` 也能直接部署，无需新建文件或添加空变量。手动指定 `DOCS_CONFIG_PATH` 后，该文件必须存在且 JSON 有效。

默认的 `docs/` 对应英文示例。要部署当前中文文档，只需将 `DOCS_PATH` 改为 `docs-zh-CN`，模板会自动读取 `docs-zh-CN/site.json`。保留默认文档仓库和 `main` 分支，保存后重新构建。若旧部署已有显式 `DOCS_CONFIG_PATH`，请删除它或改为 `docs-zh-CN/site.json`。

`SITE_URL` 用于搜索引擎等页面信息，**不会绑定自定义域名**。未设置时网站仍可访问，只省略依赖正式地址的 canonical、SEO 信息和 sitemap。确定站点地址后添加该变量，重新构建即可。

图片变量未设置时，沿用站点配置中的对应图片；未配置时使用模板内置的 Nimbus 官方 Logo。原有 `default` 和空白值继续兼容相同规则。图片 URL 或仓库路径会覆盖 JSON；仓库路径从文档源仓库根目录算起，例如 `docs-zh-CN/assets/nimbus-mark.svg`。详见[品牌资源](./site-config.md#品牌资源)。

旧部署需先[更新模板](./deployment/template-update.md)。已保存的构建变量会继续覆盖新默认行为；删除旧的 `DOCS_CONFIG_PATH` 才会启用自动查找，其他不再需要覆盖的可选变量也可删除。

公开仓库不需要 `DOCS_TOKEN`。如果文档位于私有仓库，在同一个 **构建 → 变量和机密** 区域添加 `DOCS_TOKEN`，类型选择 **Secret**，填入仅授权目标仓库、具有 **Contents: Read-only** 权限的 GitHub Token。Token 仅在 Git 拉取期间使用，不能写入仓库文件或 URL。详见[私有仓库部署](./deployment/private-repository.md)。

这些参数需要设为 **构建** 变量，普通运行时变量不会自动提供给构建。保存参数后，选择 **Retry build** 才会更新网站。逐步操作见[修改部署配置](./deployment/configuration.md)。

文档和模板在同一构建仓库、同一分支时，推送文档即可触发自动构建。使用独立文档仓库时，按[原文档仓库构建挂钩](./deployment/deploy-hook.md)连接自动更新。

## 本地运行

需要在电脑上开发模板时，准备 Git、Node.js 22.12.0 或更新版本，以及 pnpm 10.2.0，然后运行：

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

也可以使用 npm：运行 `npm ci` 安装依赖，再运行 `npm run dev`。其他命令同样可将 `pnpm <命令>` 换为 `npm run <命令>`。

打开终端输出的本地地址即可浏览文档。开发命令会先拉取 GitHub 上的文档，因此首次运行需要网络连接。

`pnpm dev` 和 `pnpm build` 都从配置的远程仓库读取内容。直接修改本地 `docs/` 或 `docs-zh-CN/` 不会改变远程文档版本。要发布自己的内容，先将修改提交并推送到配置对应的仓库和分支，再重新构建。

## 构建与预览

```sh
pnpm build
pnpm preview:cf
```

构建会依次拉取文档、转换 Markdown 和资源、校验站点配置，再生成静态页面和搜索索引。若本地链接缺失或站点配置无效，先修复源文件，再重新构建。

预览时，打开[编写文档](./writing-docs.md)和[站点配置](./site-config.md)，检查示例页面、相对链接和主题效果。页脚显示本次构建实际读取的文档提交 SHA。

确认构建产物后，可以运行 `pnpm run deploy` 发布到 Cloudflare，发布需要 Cloudflare 部署授权。部署命令只接受成功构建且未被修改的产物。修改站点后，要先重新执行 `pnpm build`。

开发模板时，使用 `pnpm test` 运行核心测试，构建后使用 `pnpm check` 检查 Astro 与 TypeScript（`pnpm typecheck` 为同义命令）。`pnpm e2e:dev --port 8787` 用于启动已构建产物，供浏览器测试访问。

继续阅读[编写文档](./writing-docs.md)，或[返回首页](./README.md)。
