---
title: 站点配置
description: 配置 Nimbus 文档站点的名称、导航、主题和品牌资源。
sidebar:
  label: 站点配置
  order: 3
---

模板在构建时读取文档源仓库中的 JSON 配置，校验后应用到站点。Logo 和 favicon 也可以通过可选构建变量单独设置。模板不加载文档源仓库的 `astro.config.*`，也不执行其中的 JavaScript 或 MDX。

## 本站示例

本仓库将配置保存在 `docs/site.json`，构建变量 `DOCS_CONFIG_PATH` 设为 `docs/site.json`。该路径相对仓库根目录，与 `DOCS_PATH` 分开计算。

```json
{
  "schemaVersion": 1,
  "title": "Nimbus Docs Template",
  "description": "使用 GitHub Markdown 构建文档站点；本仓库 docs/ 即为完整示例。",
  "locale": "zh-CN",
  "homeLabel": "首页",
  "github": "https://github.com/Azincc/nimbus-docs-template.git",
  "navigation": [
    { "label": "本站首页", "link": "/" },
    { "label": "入门", "link": "/getting-started" },
    { "label": "仓库", "link": "https://github.com/Azincc/nimbus-docs-template.git" }
  ],
  "theme": {
    "defaultMode": "system"
  },
  "brand": {
    "logo": "./assets/nimbus-mark.svg",
    "logoAlt": "Nimbus Docs Template",
    "favicon": "./assets/nimbus-mark.svg"
  }
}
```

`schemaVersion` 必须为 `1`，其他字段按需提供。将 `DOCS_CONFIG_PATH` 设为空字符串时使用通用站点配置；保留仓库默认值则读取 `docs/site.json`。未知字段或不合法的值会使构建失败，便于及时发现拼写错误。

## 配置字段

| 字段 | 格式 | 用途 |
| --- | --- | --- |
| `schemaVersion` | `1`，必填 | 配置格式版本 |
| `title` | 字符串 | 站点名称 |
| `description` | 字符串 | 站点介绍及默认描述 |
| `locale` | 语言标签，例如 `zh-CN` | 页面语言 |
| `homeLabel` | 字符串 | 首页在导航中的名称 |
| `github` | 完整 HTTPS URL 或 `null` | 仓库入口；使用 `null` 关闭 |
| `navigation` | 包含 `label`、`link` 的对象数组 | 顶部导航 |
| `theme` | 对象 | 默认外观和强调色 |
| `brand` | 对象 | Logo、favicon 和默认分享图片 |

## 导航与侧栏

`navigation` 配置顶部入口。内部链接使用已生成的站点路由，例如 `/` 或 `/getting-started`，不填写 `.md` 文件路径；外部链接使用完整 HTTPS URL。内部目标页面必须存在，否则构建会报告错误。

侧栏根据文档自动生成，与顶部导航分别配置。页面标题、描述和顺序在 Markdown frontmatter 中维护，见[编写文档](./writing-docs.md#标题和侧栏)。

## 主题

`theme.defaultMode` 支持 `system`、`light` 和 `dark`。本示例使用 `system`，默认跟随浏览器的外观偏好。

可选的 `theme.accent` 使用六位十六进制颜色，例如：

```json
{
  "theme": {
    "defaultMode": "system",
    "accent": "#2563eb"
  }
}
```

这段字段示例需要合并到完整站点 JSON 中。

## 品牌资源

### 通过构建变量设置 Logo 和 favicon

在 Cloudflare 的 **Worker → Settings → Builds → Build variables and secrets** 中添加普通变量，保存后重新构建：

| 构建变量 | 默认值 | 覆盖的 JSON 字段 | 可填写的值 |
| --- | --- | --- | --- |
| `SITE_LOGO` | 空字符串 | `brand.logo` | HTTP(S) 图片 URL，或相对文档源仓库根目录的文件路径 |
| `SITE_FAVICON` | 空字符串 | `brand.favicon` | HTTP(S) 图片 URL，或相对文档源仓库根目录的文件路径 |

这两项均可省略。构建时先读取同名环境变量，未提供时读取 `wrangler.jsonc` 的默认值；最终非空值覆盖 JSON 对应品牌字段，最终为空则继承 JSON。设置 Logo 不会改变 favicon，反之亦然。

显式空字符串也是有效的构建变量：即使 Wrangler 中配置了非空默认值，也会被这个空值覆盖，最终恢复 JSON 对应设置。删除构建变量则重新读取 Wrangler 默认值，与显式置空不同。

例如，两项都填 `docs/assets/nimbus-mark.svg`，就使用 `DOCS_REPO` 仓库根目录下的该文件；也可以填 `https://example.com/brand/logo.svg` 或 `http://example.com/brand/favicon.png` 等图片 URL。变量的本地路径始终以**文档源仓库根目录**为基准，不依赖 `DOCS_PATH` 或 `DOCS_CONFIG_PATH`，没有站点 JSON 时也可以使用。

这些是构建变量。普通 **Settings → Variables & Secrets** 中的运行时变量不会自动提供给静态构建，修改后也需要重新构建才会反映在页面上。

### 在 JSON 中维护品牌配置

| 字段 | 用途 |
| --- | --- |
| `brand.logo` | 站点品牌标识 |
| `brand.logoAlt` | Logo 的替代文字 |
| `brand.favicon` | 浏览器图标 |
| `brand.socialImage` | 默认分享图片 |

JSON 中的图片可以使用完整 HTTPS URL，或相对站点 JSON 文件的本地路径。本示例中的 `./assets/nimbus-mark.svg` 以 `docs/site.json` 为基准，指向 `docs/assets/nimbus-mark.svg`，同一图片也用在[首页](./README.md)。这个路径基准与 `SITE_LOGO`、`SITE_FAVICON` 的仓库根目录基准不同。

本地资源必须存在，解析后的路径必须处于源仓库内。模板只将被引用的资源复制到公开产物中。Markdown 图片路径则以引用它的 Markdown 文件为基准，见[图片和资源](./writing-docs.md#图片和资源)。

## 站点地址

`SITE_URL` 是可调整的构建变量，不属于站点 JSON，默认值为 `https://nimbus.az1n.com`。未提供同名环境变量时继承仓库默认值，也可以显式设为空字符串；置空后站点仍可在本地或 Cloudflare 提供的地址浏览，但不输出 canonical、依赖绝对站点地址的 SEO 元数据和 sitemap。

部署自己的站点或变更域名时，在构建变量中填写包含 `https://` 的实际公开地址并重新构建。填写 `SITE_URL` 不会自动绑定自定义域名，需先在 Cloudflare 完成域名配置。后续调整这个变量无需更改部署阶段确定的构建命令、部署命令或根目录。

## 更新与凭据

修改 `docs/site.json` 或品牌资源后，提交并推送到配置的文档源分支，然后重新触发构建。仅修改 Cloudflare 中的 `SITE_LOGO`、`SITE_FAVICON` 时，保存变量后重新构建即可。页脚和 `/_build.json` 记录实际读取的文档提交 SHA；仅改变构建变量时该 SHA 可能保持不变。

公开的 [nimbus-docs-template 示例仓库](https://github.com/Azincc/nimbus-docs-template.git) 不需要 Token。私有仓库的 `DOCS_TOKEN` 仅作为 Cloudflare Build Secret 提供给 Git fetch，不能放入站点 JSON、图片 URL 或其他公开字段。

返回[快速入门](./getting-started.md)或[首页](./README.md)。
