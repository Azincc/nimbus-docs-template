# Nimbus Docs Template

<img src="./assets/nimbus-mark.svg" alt="Nimbus 官方 Logo" width="160" />

将 GitHub 仓库中的 Markdown 文档发布为带导航、搜索和主题切换的文档站点。这份中文示例来自 [nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template.git) 文档源仓库的 `docs-zh-CN/` 文件夹；默认英文示例保存在同一仓库的 `docs/` 中。

## 从这里开始

- [快速入门](./getting-started.md)：在 Cloudflare 部署网站并填写构建参数。
- [编写文档](./writing-docs.md)：添加页面、组织目录、引用图片和链接。
- [侧栏顺序](./sidebar-order.md)：设置页面、分类和分类内页面的排列顺序。
- [站点配置](./site-config.md)：修改站点名称、导航、主题和品牌资源。
- [修改部署配置](./deployment/configuration.md)：不用编写代码，直接在 Cloudflare 填写文档源、站点地址、Logo 和浏览器图标。
- [私有仓库部署](./deployment/private-repository.md)：创建只读 Token，通过 Cloudflare Build Secret 读取私有文档。
- [原文档仓库构建挂钩](./deployment/deploy-hook.md)：连接 GitHub Webhook 与 Cloudflare Deploy Hook，让文档推送自动触发构建。
- [更新模板](./deployment/template-update.md)：应用模板后同步官方更新，或将独立的 Agent 操作说明交给 Agent 协助。
- [markdown显示测试](./markdown测试/markdown显示测试.md)：查看“markdown测试”分类中的常见 Markdown 样式。

## 示例如何工作

模板在构建时拉取文档仓库，将 `DOCS_PATH` 指定目录中的 Markdown 转换为静态页面。选择这份中文示例时，目录为 `docs-zh-CN/`。`README.md` 映射到首页，其他文件按路径生成页面；构建同时生成自动侧栏、目录和搜索索引。

这个首页没有 frontmatter。模板直接从首个标题提取页面名称；其他示例页面使用 frontmatter 指定标题、描述与侧栏顺序。页面之间的 `.md` 相对链接和上方的本地 SVG 图片会在构建时转换为站点地址。

| 构建变量 | 模板默认值（英文） |
| --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` |
| `DOCS_BRANCH` | `main` |
| `DOCS_PATH` | `docs` |
| `DOCS_CONFIG_PATH` | `docs/site.json` |
| `SITE_URL` | `https://nimbus.az1n.com` |
| `SITE_LOGO` | 空字符串，继承站点 JSON 的 `brand.logo` |
| `SITE_FAVICON` | 空字符串，继承站点 JSON 的 `brand.favicon` |

以上是模板的默认配置，读取英文 `docs/`，无需逐项重复填写。发布这份完整中文示例时，保留默认文档仓库和分支，并通过构建变量覆盖以下两项：

| 构建变量 | 中文示例值 |
| --- | --- |
| `DOCS_PATH` | `docs-zh-CN` |
| `DOCS_CONFIG_PATH` | `docs-zh-CN/site.json` |

保存后重新构建即可切换文档语言。`SITE_URL` 也可显式置空；部署自己的站点时，将它改为实际公开地址。设置这个变量不会自动绑定域名。

Logo 和 favicon 的构建变量是可选项，接受 HTTP(S) 图片 URL 或相对文档源仓库根目录的路径，例如 `docs-zh-CN/assets/nimbus-mark.svg`。同名构建环境变量优先于 `wrangler.jsonc` 默认值，最终非空值覆盖对应 JSON 品牌字段，最终为空则继承 JSON。它们不依赖站点 JSON 的位置；JSON 中的资源仍相对 JSON 文件。通过 Cloudflare **Settings → Builds → Build variables and secrets** 的普通变量修改后重新构建即可生效，运行时变量不会自动进入静态构建。详见[品牌资源](./site-config.md#品牌资源)。

较早创建的部署副本可能尚未支持这两个图片变量，需要先由模板维护者同步新版构建脚本；只添加变量不会自动升级副本。

## 内容版本

每次构建从指定分支读取一个确定的提交。页脚和 `/_build.json` 展示该文档提交的 SHA，便于确认站点内容版本。修改文档并推送后，重新触发构建即可发布更新。

这份中文文档源维护在 `docs-zh-CN/` 中；`src/content/docs/`、`public/_source/` 和 `dist/` 是构建生成目录。完整的部署及维护说明见 [仓库中文 README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.zh-CN.md)。
