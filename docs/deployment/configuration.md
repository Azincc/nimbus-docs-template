---
title: 修改部署配置
description: 部署后通过 GitHub 或 Cloudflare 修改文档源、站点地址、Logo 和 favicon，并重新构建使配置生效。
sidebar:
  label: 修改部署配置
  order: 10
---

部署后看到“构建 → 变量和机密：未配置构建变量或密钥”，表示 Cloudflare 尚未保存额外的构建变量。模板仍会读取根目录 `wrangler.jsonc` 中的 `vars` 默认值，这些文件配置不会自动列在构建变量区域。

如果找不到控制台的添加或编辑入口，可以直接在 GitHub 修改公开参数，再重新构建。

## 方式一：在 GitHub 修改配置文件

### 1. 找到实际参与构建的仓库

打开 Cloudflare 的 **Workers & Pages → 你的 Worker → Settings（设置）→ Builds（构建）**，查看关联的 GitHub 仓库和构建分支。

在 GitHub 打开这个仓库，并切换到对应分支。通过部署按钮创建站点时，这通常是复制到你账号下的模板仓库。

模板仓库保存构建代码和 `wrangler.jsonc`；文档源仓库由 `DOCS_REPO` 指定，保存 Markdown、图片和站点 JSON。它们可以是同一个仓库，也可以分开。

### 2. 编辑根目录的 wrangler.jsonc

在 GitHub 文件列表打开 `wrangler.jsonc`，点击铅笔图标编辑。找到 `"vars"`，将它的对象改为自己的配置。下面是对象内容示例：

```json
{
  "DOCS_REPO": "https://github.com/example-user/project-docs.git",
  "DOCS_BRANCH": "main",
  "DOCS_PATH": "docs",
  "DOCS_CONFIG_PATH": "docs/site.json",
  "SITE_URL": "https://docs.example.com",
  "SITE_LOGO": "",
  "SITE_FAVICON": ""
}
```

请将示例仓库和域名替换为实际值。只替换 `vars` 对象，保留外层配置及 `name`、`compatibility_date`、`assets` 等其他字段。

| 参数 | 修改方法 |
| --- | --- |
| `DOCS_REPO` | 填文档所在 GitHub 仓库的 HTTPS 地址，例如从仓库 **Code → HTTPS** 复制的克隆地址；地址中不包含 Token |
| `DOCS_BRANCH` | 填文档所在的实际分支，例如 `main`；这是文档源分支，可以与模板的构建分支不同 |
| `DOCS_PATH` | 填相对文档源仓库根目录的文档目录，例如 `docs`、`manual`；文档位于根目录时填 `.` |
| `DOCS_CONFIG_PATH` | 填相对文档源仓库根目录的站点 JSON 路径，例如 `docs/site.json`；没有此文件时填 `""` |
| `SITE_URL` | 填包含 `https://` 的实际站点地址，例如 `https://你的Worker.你的子域.workers.dev`；不附带页面路径、查询参数或锚点，也可填 `""` |
| `SITE_LOGO` | 可选；默认 `""`。填 Logo 的 HTTP(S) 图片 URL 或相对文档源仓库根目录的文件路径，例如 `docs/assets/nimbus-mark.svg` |
| `SITE_FAVICON` | 可选；默认 `""`。填 favicon 的 HTTP(S) 图片 URL 或相对文档源仓库根目录的文件路径，例如 `docs/assets/nimbus-mark.svg` |

复制模板不会自动把 `DOCS_REPO` 改成你的仓库。默认值仍为 `https://github.com/Azincc/nimbus-docs-template.git`；要发布自己副本里的 `docs/`，必须把它改成自己的仓库地址。

`DOCS_CONFIG_PATH` 与 `DOCS_PATH` 都从文档源仓库根目录计算。例如文档放在 `manual/`、配置放在 `config/site.json`，分别填写 `manual` 和 `config/site.json`。

`SITE_LOGO` 和 `SITE_FAVICON` 的本地路径也从 `DOCS_REPO` 文档源仓库根目录计算，不依赖 `DOCS_CONFIG_PATH`；没有站点 JSON 也能使用。JSON 中已有的 `brand.logo`、`brand.favicon` 本地路径继续相对 JSON 文件解析。

没有站点 JSON 时保留 `"DOCS_CONFIG_PATH": ""`，模板会使用通用站点配置。`SITE_URL` 置空后仍可浏览站点，但不会生成 canonical、依赖正式站点地址的 SEO 输出和 sitemap。填写 `SITE_URL` 不会自动绑定自定义域名，需要先在 Cloudflare 完成域名配置。

### 3. 提交并等待新构建

在 GitHub 点击 **Commit changes**，把修改提交到 Cloudflare 关联的构建分支。如果通过 Pull Request 修改，需合并到该分支后才会进入对应构建。

启用该分支的自动构建时，提交会触发一次新构建。在 Cloudflare 查看此次提交对应的构建记录，等待构建和部署成功。如果没有自动触发，检查 Builds 的仓库、分支和自动构建设置，或使用已配置的 Deploy Hook 触发该分支构建。

修改仓库文件后，要确认新构建包含这次配置提交；重试旧提交的构建不能代替构建最新的模板代码。

## 方式二：在 Cloudflare 添加构建变量

如果希望直接在控制台管理参数，打开 **你的 Worker → Settings（设置）→ Builds（构建）→ Build variables and secrets（构建变量和机密）**。

在该区域添加或编辑需要覆盖的变量，名称与上表完全一致，大小写保持一致。公开参数使用普通变量类型，只填写需要修改的项，然后保存并重新触发构建；仅修改控制台参数时，可以在构建记录中选择 **Retry build**。

公开参数的读取顺序是：

1. 当前构建环境中的同名变量。
2. 模板仓库 `wrangler.jsonc` 中的 `vars` 默认值。

因此，如果 Cloudflare 已设置 `DOCS_REPO`，修改文件中的 `DOCS_REPO` 不会覆盖它。需要同步修改控制台中的值，或删除该构建变量以恢复读取文件默认值。

`DOCS_CONFIG_PATH` 和 `SITE_URL` 的空字符串也是有效覆盖。删除构建变量会恢复文件默认值，与显式设为空字符串不同。

`SITE_LOGO` 和 `SITE_FAVICON` 也按上述顺序读取。最终非空值分别覆盖 JSON 的 `brand.logo`、`brand.favicon`；最终为空时继承 JSON 对应设置。显式空构建变量会覆盖 Wrangler 中的非空默认值并恢复 JSON 设置；删除变量才恢复读取 Wrangler 默认值。因此默认留空即可沿用已有品牌资源，只在需要覆盖时填写。两项都使用普通变量类型，不需要 Secret。

如果界面没有添加或编辑入口，公开参数可按方式一修改。私有文档仓库所需的 `DOCS_TOKEN` 仍必须保存为这里的 **Secret（机密）**，不能写入 `wrangler.jsonc`、站点 JSON 或仓库 URL。普通 **Settings → Variables & Secrets** 中的运行时变量和 Secret 不会自动提供给静态构建。具体操作见[私有仓库部署](./private-repository.md)。

## 确认修改生效

构建与部署成功后，打开站点，确认正文来自预期的文档仓库。页脚或 `/_build.json` 中的文档提交 SHA 应对应 `DOCS_REPO` 和 `DOCS_BRANCH` 实际读取的提交。

Cloudflare 构建记录显示的模板提交与页面显示的文档提交可以不同。仅修改 `SITE_URL` 等模板配置时，文档提交 SHA 也可能保持不变；此时结合新构建记录和对应页面输出确认生效。

| 遇到的情况 | 处理方法 |
| --- | --- |
| 仍然显示模板示例文档 | 确认 `DOCS_REPO` 已指向自己的仓库，并检查控制台是否有同名构建变量覆盖文件值 |
| 提示站点配置文件不存在 | 核对 `DOCS_CONFIG_PATH` 相对文档源仓库根目录的路径；没有配置文件时显式设为 `""` |
| 修改文件后站点没有更新 | 确认提交到了 Builds 关联的模板仓库与分支，并且该提交的构建和部署均成功 |
| 修改了独立文档源但没有触发构建 | 按[原文档仓库构建挂钩](./deploy-hook.md)连接文档推送与模板构建 |
| Logo 或 favicon 没有变化 | 确认变量设在 Builds 区域并已重新构建；检查非空值是否覆盖了 JSON、本地路径是否相对文档源仓库根目录 |

Logo 和 favicon 可以直接用上面的构建变量调整。站点名称、导航、主题、Logo 替代文字及完整品牌配置仍可在文档源仓库中 `DOCS_CONFIG_PATH` 指定的 JSON 维护，具体字段与优先级见[站点配置](../site-config.md)。

Cloudflare 官方说明：[构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)与[构建变量设置入口](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/#advanced-settings)。
