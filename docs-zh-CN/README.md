# Nimbus Docs Template

<img src="./assets/nimbus-mark.svg" alt="Nimbus 官方 Logo" width="160" />

这个模板把 GitHub 仓库中的 Markdown 发布成文档网站，带有导航、搜索和主题切换功能。这份中文示例放在文档源仓库 [nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template.git) 的 `docs-zh-CN/` 目录中，默认英文示例则在同一仓库的 `docs/` 中。

## 从这里开始

- [快速入门](./getting-started.md)：在 Cloudflare 部署网站并填写构建参数。
- [编写文档](./writing-docs.md)：添加页面、组织目录、引用图片和链接。
- [侧栏顺序](./sidebar-order.md)：设置页面、分类和分类内页面的排列顺序。
- [站点配置](./site-config.md)：修改站点名称、导航、主题和品牌资源。
- [修改部署配置](./deployment/configuration.md)：在 Cloudflare 填写文档源、站点地址、Logo 和浏览器图标，无需编写代码。
- [私有仓库部署](./deployment/private-repository.md)：创建只读 Token，通过 Cloudflare Build Secret 读取私有文档。
- [原文档仓库构建挂钩](./deployment/deploy-hook.md)：连接 GitHub Webhook 与 Cloudflare Deploy Hook，让文档推送自动触发构建。
- [更新模板](./deployment/template-update.md)：同步官方模板更新，也可以把专门的操作说明交给 Agent，请它协助更新。
- [markdown显示测试](./markdown测试/markdown显示测试.md)：查看“markdown测试”分类中的常见 Markdown 样式。

## 示例如何工作

每次构建时，模板都会拉取文档仓库，读取 `DOCS_PATH` 指定目录中的 Markdown，生成静态页面、侧栏、页面目录和搜索索引。这份中文示例放在 `docs-zh-CN/` 中，`README.md` 对应首页，其他文件按各自的路径生成页面。

这个首页没有 frontmatter，页面名称直接取自第一个标题。其他示例页面在 frontmatter 中设置标题、描述和侧栏顺序。构建时，页面间的 `.md` 相对链接和上方的本地 SVG 图片地址都会转换成网站中的地址。

| 构建变量 | 模板默认值（英文） |
| --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` |
| `DOCS_BRANCH` | `main` |
| `DOCS_PATH` | `docs` |

首次部署时，Cloudflare 表单只显示以上三项，保留预填值即可体验英文示例。模板会自动读取 `DOCS_PATH` 目录中的 `site.json`，找不到文件就使用通用配置，无需添加空变量。

要发布这份完整中文示例，保留默认文档仓库和分支，将 `DOCS_PATH` 改为 `docs-zh-CN`，模板就会自动读取 `docs-zh-CN/site.json`。如果旧部署中已经设置了 `DOCS_CONFIG_PATH`，请删除它或改为 `docs-zh-CN/site.json`，保存后重新构建。

其他可选变量不会出现在首次部署表单。配置文件放在其他位置时，添加 `DOCS_CONFIG_PATH` 指定路径。确定网站的实际访问地址后，再添加 `SITE_URL`。

未设置 `SITE_URL` 时网站仍可访问，只省略需要正式地址的 canonical、SEO 信息和 sitemap。填写这个变量不会自动绑定域名。

Logo 和 favicon 也可以通过构建变量设置。可填 HTTP(S) 图片 URL，也可填从文档源仓库根目录算起的路径，例如 `docs-zh-CN/assets/nimbus-mark.svg`。变量中的路径与站点 JSON 放在哪里无关，写在 JSON 中的资源路径则仍以该 JSON 文件为基准。

不设置图片变量时，模板先用 JSON 中的对应图片，没有配置就用内置的 Nimbus 官方 Logo。已有的 `default` 和空白值也按这个规则处理。填写图片 URL 或仓库路径后，会优先使用变量指定的图片。

要修改这些变量，打开 Cloudflare **Settings → Builds → Build variables and secrets**，添加普通变量后重新构建。运行时变量不会自动传给静态构建。详见[品牌资源](./site-config.md#品牌资源)。

旧部署需要先[更新模板](./deployment/template-update.md)，才能使用这些默认规则。已保存的构建变量仍然优先；想改用新默认值时，删除对应的旧变量即可。

## 内容版本

每次构建都会读取指定分支上的一个确定版本，页脚和 `/_build.json` 会显示该次文档提交的 SHA，方便核对线上内容。修改文档并推送后，重新触发构建即可发布更新。

这份中文文档在 `docs-zh-CN/` 中维护。`src/content/docs/`、`public/_source/` 和 `dist/` 中的内容都由构建生成。完整的部署及维护说明见[仓库中文 README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.zh-CN.md)。
