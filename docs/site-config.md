# 站点配置

文档在原 GitHub 仓库维护，模板在构建时读取 Markdown 和可选的站点 JSON。下面的 JSON 格式由 `nimbus-template` 校验并转换到 Nimbus 配置；不加载原仓库的 `astro.config.*`，也不执行其中的 JavaScript 或 MDX。

## 添加配置文件

在**原文档仓库**添加一个 JSON 文件，例如根目录的 `nimbus-site.json`，然后将构建变量 `DOCS_CONFIG_PATH` 设为 `nimbus-site.json`。路径相对仓库根目录，与 `DOCS_PATH` 分开。

不设置 `DOCS_CONFIG_PATH` 时，使用模板的默认站点配置。只提供需要定制的字段；提供的未知键会报错，避免拼错字段却静默无效。

以下示例适用于 Echoes 文档，其中内部 `/` 是模板生成的文档首页：

```json
{
  "schemaVersion": 1,
  "title": "Echoes 文档",
  "description": "Echoes 安装、配置与使用指南。",
  "locale": "zh-CN",
  "homeLabel": "快速上手",
  "github": "https://github.com/Azincc/echo",
  "navigation": [
    { "label": "文档", "link": "/" },
    { "label": "产品官网", "link": "https://echoesmusic.app/" }
  ],
  "theme": {
    "defaultMode": "system",
    "accent": "#2563eb"
  }
}
```

## 字段

| 字段 | 格式 | 用途 |
| --- | --- | --- |
| `schemaVersion` | `1`，必填 | 本模板的配置格式版本 |
| `title` | 字符串 | 站点名称 |
| `description` | 字符串 | 站点介绍及默认描述 |
| `locale` | 语言标签，例如 `zh-CN`、`en` | 页面语言 |
| `homeLabel` | 字符串 | 首页在导航中的名称 |
| `github` | HTTPS URL 或 `null` | GitHub 入口；使用 `null` 关闭 |
| `navigation` | `{ "label": "...", "link": "..." }` 数组 | 顶部导航 |
| `theme` | 对象 | 默认外观和强调色 |
| `brand` | 对象 | Logo、favicon 和默认分享图片 |

### 顶部导航与自动侧栏

`navigation` 配置顶部入口，不替代 Nimbus 自动发现文档生成的侧栏。每项包含 `label` 与 `link`：

- 内部链接以 `/` 开头，指向实际生成的页面路由，例如 `/` 或 `/guide/`；目标页面必须存在。
- 外部链接使用完整 HTTPS URL。
- 内部页面填写站点路由，不填写原始仓库的 `.md` 文件路径。

侧栏依据同步后的文档自动生成。可以在对应 Markdown frontmatter 中设置标题、描述及 `sidebar.label`、`sidebar.order` 等 Nimbus 支持的页面配置：

```md
---
title: 部署指南
description: 部署和升级服务的操作说明。
sidebar:
  label: 部署
  order: 2
---

# 部署指南

这里是正文。
```

没有 frontmatter 的 Markdown 也可以使用。模板从首个标题提取页面标题，并生成构建所需的元数据；已有有效配置会保留。

### 主题

```json
{
  "theme": {
    "defaultMode": "system",
    "accent": "#2563eb"
  }
}
```

`defaultMode` 允许 `system`、`light`、`dark`。`accent` 使用完整六位十六进制颜色 `#rrggbb`，例如 `#2563eb`。

### 品牌资源

```json
{
  "brand": {
    "logo": "./brand/logo.svg",
    "logoAlt": "Echoes",
    "favicon": "./brand/favicon.svg",
    "socialImage": "./brand/social.png"
  }
}
```

这是需要合并到完整站点 JSON 的字段示例。对应文件必须存在。

| 字段 | 用途 |
| --- | --- |
| `logo` | 站点品牌标识 |
| `logoAlt` | Logo 的替代文字 |
| `favicon` | 浏览器图标 |
| `socialImage` | 默认分享图片 |

图片可以使用 HTTPS URL，或**相对站点 JSON 文件**的仓库资源路径。对于仓库根目录的 `nimbus-site.json`，`./brand/logo.svg` 对应仓库根目录的 `brand/logo.svg`；若配置在 `config/nimbus-site.json`，则对应 `config/brand/logo.svg`。

资源可以在文档目录之外，但解析后必须仍处于原仓库范围内。模板只把文档使用的资源复制到生成的公开资产中。不要把仅供构建使用的凭据放进品牌资源、图片 URL 或 JSON 字段。

## 文档目录与链接

`DOCS_PATH` 是原仓库中的文档目录，例如 `gitbook`。模板读取该目录内的 `.md` 文档，并从完整原仓库中解析它们引用的资源。

| 原文档相对路径 | 站点路径 |
| --- | --- |
| `README.md` 或 `index.md` | `/` |
| `guide/README.md` 或 `guide/index.md` | `/guide/` |
| `installation.md` | `/installation/` |
| `guide/configuration.md` | `/guide/configuration/` |

没有根首页文件时生成目录首页。同一个目录内同时出现 `README.md` 与 `index.md` 会产生路由冲突并使构建失败；保留一个即可。文件路径逐段转成小写 slug，表格以原路径已是小写的文档为例。

非首页文档可以使用 frontmatter 的 `slug` 自定义路径，例如 `slug: guide/setup`，不要添加开头的 `/`。首页需要保留其目录首页映射，不支持另设 `slug`。不要保留另一个模板示例首页与真实内容竞争 `/` 路由。

Markdown 中的相对 `.md` 链接会转换到生成路由，并保留锚点。例如：

```md
[部署说明](./guide/README.md)
[配置说明](./guide/configuration.md#连接服务器)
![设置页面](../docs/screenshots/settings.png)
```

图片路径相对**引用它的 Markdown 文件**，品牌资源路径相对**站点 JSON 文件**，两者的基准不同。`../docs/screenshots/` 是受支持的跨文档目录引用，只要目标仍在原仓库中。

第一版忽略 `.mdx`。指向不存在的本地文档或资源会使构建失败；文档目录之外的 `.md` 不会成为本站页面，链接到它们时应使用完整 GitHub URL。隐藏文件/目录、符号链接和越出原仓库范围的路径不会被发布。

每次构建都重新生成文档集合与所引用的资源；删除原文档后，重建会移除对应页面和自动侧栏项。额外写在 `navigation` 中的入口需要同步调整，指向已删除页面的内部入口会使校验失败。

## SITE_URL 与公开地址

`SITE_URL` 是构建配置，放在 Cloudflare Build variables，或模板仓库的 Wrangler 公开默认值中。它不是站点 JSON 的字段。

- 空值：站点仍能在 `workers.dev` 或本地浏览；不输出 canonical、依赖绝对站点 URL 的 SEO 元数据和 sitemap。
- 正式地址：例如 `https://docs.echoesmusic.app`；设置后重新构建，生成对应的 canonical、绝对 SEO 地址与 sitemap。

仅填写 `SITE_URL` 不会替你绑定 Cloudflare 自定义域名。先配置站点实际使用的域名，再保持此值与公开地址一致。

## 构建来源与配置错误

页面页脚与 `/_build.json` 记录本次实际读取的原文档提交 SHA，用于定位内容版本。它与模板仓库的提交 SHA 不同。

配置 JSON 格式错误、未知字段、不合法的主题值、缺失的资源或不成立的内部导航会在构建时报告错误。修复原仓库配置或文档并重新触发构建即可；不要通过删除校验来隐藏配置错误。

`DOCS_TOKEN` 属于 Cloudflare **Build Secret**，只在构建进程环境中提供；它不是该 JSON 格式的一部分。公开源不需要 Token。
