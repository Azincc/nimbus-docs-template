---
title: 编写文档
description: 使用普通 Markdown 编写页面、组织目录，并添加相对链接和本地图片。
sidebar:
  label: 编写文档
  order: 20
---

在文档源仓库中，将 `.md` 文件放在 `DOCS_PATH` 指定的目录下。本中文示例使用 `docs-zh-CN/`，默认英文示例使用 `docs/`。

模板会自动发现页面。构建时只写入临时目录和生成目录，不修改原始文件。

## 组织页面

本示例的文档结构如下：

```text
docs-zh-CN/
├── README.md
├── getting-started.md
├── writing-docs.md
├── sidebar-order.md
├── site-config.md
├── deployment.md
├── deployment/
│   ├── configuration.md
│   ├── private-repository.md
│   └── deploy-hook.md
├── markdown测试.md
├── markdown测试/
│   └── markdown显示测试.md
├── site.json
└── assets/
    └── nimbus-mark.svg
```

| 文档路径 | 站点路由 |
| --- | --- |
| `docs-zh-CN/README.md` | `/` |
| `docs-zh-CN/getting-started.md` | `/getting-started` |
| `docs-zh-CN/writing-docs.md` | `/writing-docs` |
| `docs-zh-CN/sidebar-order.md` | `/sidebar-order` |
| `docs-zh-CN/site-config.md` | `/site-config` |
| `docs-zh-CN/deployment.md` | `/deployment` |
| `docs-zh-CN/deployment/configuration.md` | `/deployment/configuration` |
| `docs-zh-CN/deployment/private-repository.md` | `/deployment/private-repository` |
| `docs-zh-CN/deployment/deploy-hook.md` | `/deployment/deploy-hook` |
| `docs-zh-CN/markdown测试.md` | `/markdown测试` |
| `docs-zh-CN/markdown测试/markdown显示测试.md` | `/markdown测试/markdown显示测试` |

子目录也可以添加 `README.md` 或 `index.md` 作为目录首页。同一目录只保留其中一个，避免两个文件占用同一路由。普通文件按路径生成小写 slug。

常见语法的实际渲染效果见 [markdown显示测试](./markdown测试/markdown显示测试.md)。

## 标题和侧栏

普通 Markdown 可以直接以一级标题开头，模板会将首个标题用作页面标题。本示例的[首页](./README.md)就采用这种写法。

需要设置描述、侧栏名称或顺序时，在文件开头加入 frontmatter：

```md
---
title: 编写文档
description: 使用 Markdown 维护文档页面。
sidebar:
  label: 编写文档
  order: 20
---

从这里开始编写正文。

## 添加内容

使用普通 Markdown 的标题、列表、表格和代码块。
```

页面以 `title` 为主标题，无需在正文重复。侧栏会自动收录页面，`sidebar.order` 越小，位置越靠前。

本示例使用 `10、20、30…` 为同级页面排序，方便在中间插入新页面。要设置分类的位置，需修改与目录同级、同名的 Markdown 文件。例如，[deployment.md](./deployment.md) 决定整个“部署指南”分类的位置，`deployment/` 内各页面的 `sidebar.order` 决定分类内的顺序。

详细步骤、完整配置示例和当前文档的顺序对照见[配置侧栏顺序](./sidebar-order.md)。

非首页页面可以设置 `slug` 自定义路由，例如 `slug: writing-docs`，不要添加开头或结尾的 `/`。目录首页保留自动映射，不另设 slug。

## 相对链接

用文档文件之间的相对路径书写链接：

```md
[快速入门](./getting-started.md)
[站点配置](./site-config.md)
[页面首页](./README.md)
```

构建后，这些链接会指向对应的站点页面，`#` 后的标题锚点也会保留，例如[站点主题](./site-config.md#主题)。

目标文件必须存在。文档目录外的 Markdown 不会生成本站页面，引用仓库 README 等文件时使用完整 GitHub 地址。

## 图片和资源

图片路径以当前 Markdown 文件为基准。本示例的首页引用 `docs-zh-CN/assets/nimbus-mark.svg`：

```md
![Nimbus 文档标识](./assets/nimbus-mark.svg)
```

模板会复制被引用的本地资源并重写地址。图片可以放在原仓库的其他普通目录中，但路径不能越出仓库；隐藏文件、隐藏目录和符号链接不会被发布。

品牌 Logo 和 favicon 也可以通过普通构建变量 `SITE_LOGO`、`SITE_FAVICON` 设置，两项均可省略。可以填写 HTTP(S) 图片 URL，也可以填写相对 `DOCS_REPO` 文档源仓库根目录的路径，例如 `docs-zh-CN/assets/nimbus-mark.svg`。

变量中的本地路径不依赖站点 JSON 的位置。JSON 中的 `brand.logo`、`brand.favicon` 本地路径仍以 JSON 文件为基准。

这两项不会出现在首次部署表单，需要自定义图片时再添加。填写图片 URL 或仓库路径会覆盖对应的 JSON 字段。未设置变量时沿用 JSON；JSON 中也没有对应字段时，使用模板内置的 Nimbus 官方 Logo。原有的 `default` 和空白值仍按这一规则处理。

在 Cloudflare Builds 区域保存变量后，重新构建才会生效。具体见[品牌资源](./site-config.md#品牌资源)。

## 发布更新

提交并推送文档修改后，重新触发站点构建，生成新的页面和侧栏。删除文档文件后，下次构建也会移除对应页面；如果顶部导航手动引用了该页面，还需修改 `docs-zh-CN/site.json`。

独立文档源可以通过[构建挂钩](./deployment/deploy-hook.md)在 push 后自动重建，省去每次手动触发的步骤。

模板目前只处理 `.md` 文件，忽略 `.mdx`，也不执行文档源中的 JavaScript 或 MDX 组件。需要调整模板代码时，直接修改模板项目，并参考[仓库维护说明](https://github.com/Azincc/nimbus-docs-template/blob/main/AGENT.md)。
