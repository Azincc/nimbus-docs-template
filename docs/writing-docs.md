---
title: 编写文档
description: 使用普通 Markdown 编写页面、组织目录，并添加相对链接和本地图片。
sidebar:
  label: 编写文档
  order: 2
---

在文档源仓库的 `docs/` 中维护 `.md` 文件。模板会自动发现页面，保留原始文件不变，只向临时和生成目录写入构建内容。

## 组织页面

本示例的文档结构如下：

```text
docs/
├── README.md
├── getting-started.md
├── writing-docs.md
├── site-config.md
├── site.json
└── assets/
    └── nimbus-mark.svg
```

| 文档路径 | 站点路由 |
| --- | --- |
| `docs/README.md` | `/` |
| `docs/getting-started.md` | `/getting-started` |
| `docs/writing-docs.md` | `/writing-docs` |
| `docs/site-config.md` | `/site-config` |

子目录也可以添加 `README.md` 或 `index.md` 作为目录首页。同一目录只保留其中一个，避免两个文件竞争同一路由。普通文件按照路径生成小写 slug。

## 标题和侧栏

普通 Markdown 可以直接以一级标题开头，像本示例的[首页](./README.md)一样，模板会从首个标题提取页面标题。

需要设置描述、侧栏名称或顺序时，在文件开头加入 frontmatter：

```md
---
title: 编写文档
description: 使用 Markdown 维护文档页面。
sidebar:
  label: 编写文档
  order: 2
---

从这里开始编写正文。

## 添加内容

使用普通 Markdown 的标题、列表、表格和代码块。
```

页面会显示 `title` 作为主标题，无需在正文重复。侧栏自动收录页面；较小的 `sidebar.order` 排在前面。

非首页页面可以设置 `slug` 自定义路由，例如 `slug: writing-docs`，不要添加开头或结尾的 `/`。目录首页保留自动映射，不另设 slug。

## 相对链接

用文档文件之间的相对路径书写链接：

```md
[快速入门](./getting-started.md)
[站点配置](./site-config.md)
[页面首页](./README.md)
```

构建后这些链接指向对应站点页面，也支持保留 `#` 后的标题锚点。例如：[站点主题](./site-config.md#主题)。

目标文件必须存在。文档目录外的 Markdown 不会生成本站页面，引用仓库 README 等文件时使用完整 GitHub 地址。

## 图片和资源

图片路径以当前 Markdown 文件为基准。本示例的首页引用 `docs/assets/nimbus-mark.svg`：

```md
![Nimbus 文档标识](./assets/nimbus-mark.svg)
```

模板会复制被引用的本地资源并重写地址。图片可以放在原仓库的其他普通目录中，但路径不能越出仓库；隐藏文件、隐藏目录和符号链接不会被发布。

品牌 Logo 和 favicon 的路径以站点 JSON 文件为基准，具体见[品牌资源](./site-config.md#品牌资源)。

## 发布更新

提交并推送文档修改后，重新触发站点构建。构建会重新生成页面与自动侧栏；删除文件后，对应页面也会从下次产物中移除。若顶部导航手动引用了删除的页面，同时修改 `docs/site.json`。

当前文档输入仅处理 `.md`，忽略 `.mdx`；文档源不执行 JavaScript 或 MDX 组件。需要调整模板代码时，直接修改模板项目，并参考[仓库维护说明](https://github.com/Azincc/nimbus-docs-template/blob/main/AGENT.md)。

继续阅读[站点配置](./site-config.md)，或[返回首页](./README.md)。
