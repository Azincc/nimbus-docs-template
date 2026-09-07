---
title: 快速入门
description: 运行 Nimbus Docs Template 自带的文档示例，并了解构建配置。
sidebar:
  label: 快速入门
  order: 1
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

## 构建配置

公开默认值保存在项目根目录的 `wrangler.jsonc`，同名环境变量可以覆盖它们。默认示例可以直接使用：

| 变量 | 值 | 作用 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | 文档源仓库 |
| `DOCS_BRANCH` | `main` | 拉取的分支 |
| `DOCS_PATH` | `docs` | 相对仓库根目录的文档路径 |
| `DOCS_CONFIG_PATH` | `docs/site.json` | 相对仓库根目录的站点配置路径 |
| `SITE_URL` | 留空 | 获得正式站点地址后再设置 |

使用自己的文档时，将仓库、分支和路径改为实际内容的位置。公开仓库不需要 `DOCS_TOKEN`；私有仓库将只读 Token 保存为 Cloudflare Build Secret，仅在 Git 拉取期间使用。

## 构建与预览

```sh
pnpm build
pnpm preview
```

构建依次完成文档拉取、Markdown 和资源转换、站点配置校验、静态页面及搜索索引生成。若本地链接缺失或站点配置无效，先修复源文件，再重新构建。

在预览中打开[编写文档](./writing-docs.md)和[站点配置](./site-config.md)，即可检查示例页面、相对链接和主题效果。页脚展示本次构建实际读取的文档提交 SHA。

## 部署到 Cloudflare

打开[仓库 README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.md) 中的 Deploy to Cloudflare 按钮，按其中的流程创建 Worker 并连接 GitHub 仓库。构建命令使用 `pnpm run build`，部署命令使用 `pnpm run deploy`。

需要覆盖默认文档源时，在 Worker 的 **Settings → Builds → Build variables and secrets** 中填写上述公开变量，然后重新触发构建。成功后使用 Cloudflare 提供的站点地址访问；设置自定义域名后，可同步填写 `SITE_URL` 并重新构建。

继续阅读[编写文档](./writing-docs.md)，或[返回首页](./README.md)。
