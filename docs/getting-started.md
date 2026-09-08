---
title: 快速入门
description: 在 Cloudflare 页面部署文档网站并填写构建参数，无需编写代码。
sidebar:
  label: 快速入门
  order: 10
---

通过 Cloudflare 页面即可部署和修改配置，无需安装开发工具或编辑代码。模板默认读取[示例仓库](https://github.com/Azincc/nimbus-docs-template.git) `main` 分支中的 `docs/`，你可以在部署后换成自己的文档仓库。

## 部署到 Cloudflare

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2FAzincc%2Fnimbus-docs-template)
<!-- deploy-button:end -->

1. 点击上方 **Deploy to Cloudflare**，按提示授权 GitHub，创建自己的模板仓库和 Worker。
2. 确认构建命令为 `pnpm run build`、部署命令为 `pnpm run deploy`，根目录为仓库根目录。
3. 打开该 Worker 的 **设置（Settings）→ 构建（Builds）→ 变量和机密（Variables and secrets）**，点击 **添加**，按下节填写需要修改的参数。
4. 保存后，进入构建记录，对最新一次构建选择 **重试构建（Retry build）**。等待成功，再打开 Cloudflare 提供的 `workers.dev` 地址。

以后需要更换文档源、站点地址、Logo 或 favicon，回到同一位置修改对应的值，保存并重新构建即可。

首次部署可能先显示示例文档。看到“未配置构建变量或密钥”表示你还没有在控制台添加参数，此时仍会读取模板默认值。复制模板不会自动把文档源改成你的仓库。

## 构建变量

以下 7 项都可以在 **构建 → 变量和机密** 中添加为普通变量。只填写需要修改的项，未添加的项沿用模板默认值。

添加时，**名称和值填在各自的输入框中，值不加引号**。例如名称填 `DOCS_BRANCH`，值填 `main`。

| 变量名称 | 默认值 | 如何填写 |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | 改成自己的文档仓库 HTTPS 地址，如 `https://github.com/你的用户名/文档仓库.git` |
| `DOCS_BRANCH` | `main` | 文档所在的分支名称 |
| `DOCS_PATH` | `docs` | 仓库里的文档文件夹；文档在仓库根目录时填 `.` |
| `DOCS_CONFIG_PATH` | `docs/site.json` | 仓库里的站点配置文件路径；没有此文件时添加变量并将值留空 |
| `SITE_URL` | `https://nimbus.az1n.com` | 改成自己的完整站点地址，如 `https://你的Worker.你的子域.workers.dev`；暂不确定时添加变量并将值留空 |
| `SITE_LOGO` | 空 | 可选；填 Logo 的 HTTP(S) 图片地址，或仓库里的图片文件路径 |
| `SITE_FAVICON` | 空 | 可选；填浏览器标签页图标的 HTTP(S) 图片地址，或仓库里的图片文件路径 |

“将值留空”是清空值的输入框，**不要输入两个引号 `""`**。不添加变量会继承默认值；添加变量并留空，才会覆盖原来的默认值。

`SITE_URL` 用于搜索引擎等页面信息，**不会绑定自定义域名**。留空仍可访问网站，但不会生成依赖正式域名的 canonical 和 sitemap。

`SITE_LOGO` 和 `SITE_FAVICON` 可以不添加；非空时覆盖站点配置文件中的品牌图片，留空则沿用站点配置。使用仓库图片时，填写 `docs/assets/nimbus-mark.svg` 这样的路径，从文档仓库根目录算起。详见[品牌资源](./site-config.md#品牌资源)。

较早创建的部署副本可能尚未支持这两个图片变量，需要先由模板维护者同步新版构建脚本；只添加变量不会自动升级副本。

公开仓库不需要 `DOCS_TOKEN`。如果文档位于私有仓库，在同一个 **构建 → 变量和机密** 区域添加 `DOCS_TOKEN`，类型选择 **Secret**，填入仅授权目标仓库、具有 **Contents: Read-only** 权限的 GitHub Token。Token 仅在 Git 拉取期间使用，不能写入仓库文件或 URL。详见[私有仓库部署](./deployment/private-repository.md)。

请确认设置的是 **构建** 变量；普通运行时变量不会自动提供给构建。保存参数后，选择 **Retry build** 才会更新网站。逐步操作见[修改部署配置](./deployment/configuration.md)。

文档和模板在同一构建仓库、同一分支时，推送文档即可触发自动构建。使用独立文档仓库时，按[原文档仓库构建挂钩](./deployment/deploy-hook.md)连接自动更新。

## 本地运行

需要在电脑上开发模板时，准备 Git、Node.js 22.12.0 或更新版本，以及项目指定的 pnpm 11.19.0，然后运行：

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的本地地址即可浏览文档。开发命令会先拉取 GitHub 上的文档，因此首次运行需要网络连接。

`pnpm dev` 和 `pnpm build` 均以配置的远程仓库为内容源。直接修改本地 `docs/` 不会改变远程文档版本；发布自己的内容时，将修改提交并推送到配置对应的仓库和分支，再重新运行构建。

## 构建与预览

```sh
pnpm build
pnpm preview
```

构建依次完成文档拉取、Markdown 和资源转换、站点配置校验、静态页面及搜索索引生成。若本地链接缺失或站点配置无效，先修复源文件，再重新构建。

在预览中打开[编写文档](./writing-docs.md)和[站点配置](./site-config.md)，即可检查示例页面、相对链接和主题效果。页脚展示本次构建实际读取的文档提交 SHA。

继续阅读[编写文档](./writing-docs.md)，或[返回首页](./README.md)。
