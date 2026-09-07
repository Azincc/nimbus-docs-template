# Nimbus Docs Template

![Nimbus 文档标识](./assets/nimbus-mark.svg)

将 GitHub 仓库中的 Markdown 文档发布为带导航、搜索和主题切换的文档站点。这个站点的内容来自 [nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template.git) 自身的 `docs/` 文件夹，也是模板的可运行示例。

## 从这里开始

- [快速入门](./getting-started.md)：运行示例，了解构建和部署所需的配置。
- [编写文档](./writing-docs.md)：添加页面、组织目录、引用图片和链接。
- [站点配置](./site-config.md)：修改站点名称、导航、主题和品牌资源。

## 示例如何工作

模板在构建时拉取文档仓库，将 `docs/` 中的 Markdown 转换为静态页面。`README.md` 映射到首页，其他文件按路径生成页面；构建同时生成自动侧栏、目录和搜索索引。

这个首页没有 frontmatter。模板直接从首个标题提取页面名称；其他示例页面使用 frontmatter 指定标题、描述与侧栏顺序。页面之间的 `.md` 相对链接和上方的本地 SVG 图片会在构建时转换为站点地址。

| 构建配置 | 本站示例值 |
| --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` |
| `DOCS_BRANCH` | `main` |
| `DOCS_PATH` | `docs` |
| `DOCS_CONFIG_PATH` | `docs/site.json` |
| `SITE_URL` | 留空 |

## 内容版本

每次构建从指定分支读取一个确定的提交。页脚和 `/_build.json` 展示该文档提交的 SHA，便于确认站点内容版本。修改文档并推送后，重新触发构建即可发布更新。

文档源维护在 `docs/` 中；`src/content/docs/`、`public/_source/` 和 `dist/` 是构建生成目录。完整的部署及维护说明见 [仓库 README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.md)。
