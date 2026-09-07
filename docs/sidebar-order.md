---
title: 配置侧栏顺序
description: 设置文档页面、目录分类和分类内页面的顺序，了解默认排序规则与发布步骤。
sidebar:
  label: 侧栏顺序
  order: 25
---

左侧菜单按 Markdown 文件开头的 `sidebar.order` 排序，数字越小越靠前。排序只比较同一层级的项目：分类的位置和分类内页面的位置分别设置。

在 `DOCS_REPO` 指定的文档源仓库中修改这些文件。本示例的文档目录为 `docs/`，`src/content/docs/` 是生成目录，不在其中维护排序。

## 设置页面顺序

在页面开头的两行 `---` 之间添加或修改 frontmatter。例如，[编写文档](./writing-docs.md) 的配置为：

```md
---
title: 编写文档
description: 使用普通 Markdown 编写文档页面。
sidebar:
  label: 编写文档
  order: 20
---

从这里开始编写正文。
```

`title` 是页面标题，`sidebar.label` 是侧栏名称，`sidebar.order` 是排序数字。`label` 可以省略，省略后使用 `title`。如果文件已有 frontmatter，直接修改其中的 `sidebar`，不用再添加第二段。

`order` 使用数字，例如 `20`，不要写成带引号的 `"20"`。YAML 用空格缩进，`label` 和 `order` 对齐。

建议按 `10、20、30…` 留出间隔。要在 `20` 与 `30` 之间插入页面，可以设为 `25`；本指南就使用 `25`，位于“编写文档”之后、“站点配置”之前。

## 设置整个分类的顺序

在当前模板中，使用与目录同级、同名的 Markdown 文件配置分类。例如：

```text
docs/
├── deployment.md                 ← 整个分类的配置
└── deployment/
    ├── configuration.md          ← 分类内的页面
    ├── private-repository.md
    └── deploy-hook.md
```

[deployment.md](./deployment.md) 的 frontmatter 为：

```yaml
---
title: 部署指南
description: 修改部署配置、连接私有文档仓库，并设置自动构建。
sidebar:
  order: 40
  group:
    label: 部署指南
    hideIndex: true
---
```

这里的 `sidebar.order: 40` 控制整个分类的位置。`sidebar.group.label` 设置分类名称，`hideIndex: true` 让分类保留子页面列表，同时不把入口页面作为侧栏中的概览链接展示；入口页面本身仍然可以通过链接访问。

`order` 写在 `sidebar` 下，与 `group` 同级，不写成 `sidebar.group.order`。入口文件中还可以写分类介绍及子页面链接，参考现有的 [部署指南](./deployment.md)。

当前模板里，目录内的 `README.md` 或 `index.md` 不能直接充当这个分类配置文件。需要控制整个分类时使用 `deployment.md`；如果原来已有 `deployment/README.md` 或 `deployment/index.md`，先把概览内容迁移到 `deployment.md` 并更新引用，避免两个文件占用同一个 `/deployment` 路由。

## 设置分类内部的顺序

分别编辑 `deployment/` 内各页面的 frontmatter。例如，[修改部署配置](./deployment/configuration.md) 使用：

```yaml
---
title: 修改部署配置
sidebar:
  label: 修改部署配置
  order: 10
---
```

当前部署分类内的顺序为：

| 文件 | `sidebar.order` | 侧栏名称 |
| --- | --- | --- |
| `deployment/configuration.md` | `10` | 修改部署配置 |
| `deployment/private-repository.md` | `20` | 私有仓库部署 |
| `deployment/deploy-hook.md` | `30` | 构建挂钩 |

子页面的 `10` 只决定它在部署分类内排第一；整个分类仍按 `deployment.md` 的 `40` 排列。不同分类内可以重复使用 `10、20、30`。

## 当前文档的根级顺序

| 文件 | `sidebar.order` | 页面或分类 |
| --- | --- | --- |
| `getting-started.md` | `10` | 快速入门 |
| `writing-docs.md` | `20` | 编写文档 |
| `sidebar-order.md` | `25` | 侧栏顺序 |
| `site-config.md` | `30` | 站点配置 |
| `deployment.md` | `40` | 部署指南 |
| `markdown测试.md` | `50` | markdown测试 |

表中的文件均位于本示例的 `docs/` 下。调整根级位置时修改对应文件；调整子页面时修改分类目录内的文件。

默认排序规则如下：

- 普通页面未填写 `sidebar.order` 时，排在已设置顺序的同级项目之后。
- 分类未显式设置顺序时，取子项中最小的 `order`；子项也都未设置时，该分类排在已设置顺序的同级项目之后。
- 同级项目的 `order` 相同时，按侧栏显示名称排序。需要固定先后关系时，使用不同的数字。

给分类入口显式设置 `order`，可以避免新增或调整子页面后，整个分类的位置跟着改变。

## 让修改生效

保存文档后，提交并推送到 `DOCS_REPO` 的 `DOCS_BRANCH` 分支，再触发站点构建。构建与部署成功后刷新页面，查看侧栏顺序。

文档与模板使用同一仓库、同一构建分支且已启用自动构建时，推送会触发更新。独立文档源可通过[构建挂钩](./deployment/deploy-hook.md)自动触发；本地的 `pnpm dev` 和 `pnpm build` 也会读取远程文档，需要先推送修改。

如果顺序没有变化，确认修改的是实际文档源、对应分支已推送，并且新构建成功。若只改变了分类内顺序，请检查自己修改的是子页面还是同级的分类入口文件。

顶部导航由站点 JSON 的 `navigation` 数组顺序控制，与 `sidebar.order` 分开，详见[站点配置](./site-config.md#导航与侧栏)。
