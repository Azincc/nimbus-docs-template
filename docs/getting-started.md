---
title: 快速入门
description: 运行 Nimbus Docs Template 自带的文档示例，并了解构建配置。
sidebar:
  label: 快速入门
  order: 10
---

示例文档和模板代码维护在同一个 [GitHub 仓库](https://github.com/Azincc/nimbus-docs-template.git)。默认配置读取 `main` 分支的 `docs/`，站点配置文件为 `docs/site.json`。

## 本地运行

准备 Git、Node.js 22.12.0 或更新版本，以及项目指定的 pnpm 11.19.0，然后运行：

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的本地地址即可浏览文档。开发命令会先拉取 GitHub 上的文档，因此首次运行需要网络连接。

`pnpm dev` 和 `pnpm build` 均以配置的远程仓库为内容源。直接修改本地 `docs/` 不会改变远程文档版本；发布自己的内容时，将修改提交并推送到配置对应的仓库和分支，再重新运行构建。

## 构建变量

公开默认值保存在项目根目录的 `wrangler.jsonc`，无需逐项重复填写，同名环境变量可以覆盖它们。默认示例可以直接使用：

| 变量 | 值 | 作用 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | 文档源仓库 |
| `DOCS_BRANCH` | `main` | 拉取的分支 |
| `DOCS_PATH` | `docs` | 相对仓库根目录的文档路径 |
| `DOCS_CONFIG_PATH` | `docs/site.json` | 相对仓库根目录的站点配置路径 |
| `SITE_URL` | `https://nimbus.az1n.com` | 站点公开地址，可覆盖或显式置空 |
| `SITE_LOGO` | 空字符串 | 可选 Logo；HTTP(S) 图片 URL 或相对文档源仓库根目录的文件路径 |
| `SITE_FAVICON` | 空字符串 | 可选 favicon；HTTP(S) 图片 URL 或相对文档源仓库根目录的文件路径 |

使用自己的文档时，将仓库、分支和路径改为实际内容的位置，并将 `SITE_URL` 改为包含 `https://` 的实际公开地址。`DOCS_CONFIG_PATH` 可显式置空以使用通用站点配置，`SITE_URL` 可显式置空以不指定正式站点地址。公开仓库不需要 `DOCS_TOKEN`；私有仓库将只读 Token 保存为 Cloudflare Build Secret，仅在 Git 拉取期间使用。

`SITE_LOGO` 和 `SITE_FAVICON` 无需填写，也不要求先配置站点 JSON。同名构建环境变量优先于 Wrangler 默认值，最终非空值覆盖 JSON 的 `brand.logo` 或 `brand.favicon`，最终为空则继承 JSON。使用仓库文件时填 `docs/assets/nimbus-mark.svg` 这类相对 `DOCS_REPO` 根目录的路径；JSON 中的品牌资源继续相对 JSON 文件。完整说明见[品牌资源](./site-config.md#品牌资源)。

如果文档位于私有仓库，请按[私有仓库部署](./deployment/private-repository.md)完成 Token 授权、构建变量和 Secret 设置，再执行首次构建。

部署后需要更换参数，或看到“未配置构建变量或密钥”时，按[修改部署配置](./deployment/configuration.md)在 GitHub 编辑 `wrangler.jsonc`，也可通过 Cloudflare 构建变量覆盖默认值。

## 构建与预览

```sh
pnpm build
pnpm preview
```

构建依次完成文档拉取、Markdown 和资源转换、站点配置校验、静态页面及搜索索引生成。若本地链接缺失或站点配置无效，先修复源文件，再重新构建。

在预览中打开[编写文档](./writing-docs.md)和[站点配置](./site-config.md)，即可检查示例页面、相对链接和主题效果。页脚展示本次构建实际读取的文档提交 SHA。

## 部署到 Cloudflare

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FAzincc%2Fnimbus-docs-template)
<!-- deploy-button:end -->

点击上方 **Deploy to Cloudflare** 按钮，按流程创建 Worker 并连接 GitHub 仓库，无需本地安装 Node.js。在部署配置阶段确定构建命令 `pnpm run build`、部署命令 `pnpm run deploy` 和根目录为仓库根目录；该部署流程确认后不再修改这组构建配置。

构建配置与公开变量分开。后续更换文档源、站点地址、Logo 或 favicon 时，在 Worker 的 **Settings → Builds → Build variables and secrets** 中调整相应普通变量，或修改仓库内的公开默认值，然后重新触发构建。变量仍可修改，未填写时继承默认值；普通运行时变量不会自动提供给静态构建。成功后使用 Cloudflare 提供的站点地址访问；设置 `SITE_URL` 不会自动绑定自定义域名。

首次部署成功后，按[原文档仓库构建挂钩](./deployment/deploy-hook.md)为独立文档源配置自动更新。公开仓库和私有仓库使用同一挂钩流程。

继续阅读[编写文档](./writing-docs.md)，或[返回首页](./README.md)。
