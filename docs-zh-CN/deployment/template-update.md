---
title: 更新已部署的模板
description: 为站点使用者说明如何更新模板、交给 Agent 协助，以及确认网站更新成功。
audience: human
sidebar:
  label: 更新模板
  order: 40
---

应用模板后，你的部署仓库保存了一份模板代码。官方模板有更新时，需要将代码同步到这个仓库，再由 Cloudflare 构建和发布。

继续使用原来的部署仓库和 Worker，可以保留已有域名及 Cloudflare 中的构建变量和机密。需要 Agent 协助时，将独立的 [Agent 更新说明](./template-update-agent.md)交给它读取。

## 1. 找到需要更新的仓库

打开 Cloudflare 的 **Workers 和 Pages → 你的 Worker → 设置 → 构建**，查看 **Git 存储库** 和 **生产分支**。这里关联的仓库才是需要更新模板代码的部署仓库。

`DOCS_REPO` 指定的是文档源仓库，负责保存 Markdown、图片和站点配置。它可以与部署仓库相同，也可以是另一个仓库。只更新文档源，或在 Cloudflare 重试构建，都不会自动同步官方模板代码。

打开部署仓库的 GitHub 页面，按以下情况选择操作：

| 仓库情况 | 更新方法 |
| --- | --- |
| 仓库名称下方显示 `forked from Azincc/nimbus-docs-template`，并有 **Sync fork** 按钮 | 使用下面的 GitHub 网页同步步骤 |
| 通过 **Deploy to Cloudflare** 创建的独立副本，没有上述 Fork 关系 | 按第 3 节交给 Agent 或维护者协助 |

官方模板：[Azincc/nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template)。可在[提交记录](https://github.com/Azincc/nimbus-docs-template/commits/main/)查看近期变化。

## 2. Fork 仓库：在 GitHub 页面同步

1. 打开自己的部署仓库，切换到 Cloudflare 使用的生产分支，通常为 `main`。
2. 点击 **Sync fork → Update branch**，同步官方仓库的更新。
3. 如果 GitHub 提示有冲突，交给 Agent 或维护者按下一节处理。
4. 同步成功后，到 Cloudflare 查看新提交对应的构建和部署记录。

这个入口仅适用于真正 Fork 自官方模板的仓库。独立副本目前没有内置“同步模板”工作流，可以使用下一节的方法。

## 3. 独立副本：交给 Agent 协助

准备以下信息：

- Cloudflare 关联的部署仓库地址。
- 实际生产分支和 Worker 名称。
- 原站点的访问地址。
- 希望保留的定制，例如自己的文档、图片、主题或页面修改。

打开 [Agent 更新说明](./template-update-agent.md)，点击那一页的 **View as Markdown**，把打开的链接与上述信息一起交给能够访问仓库的 Agent。也可以使用那一页的 **Copy page** 复制完整操作说明。

告诉 Agent 你希望它完成到哪一步：准备更新供你检查，或继续推送、合并和发布。你不需要自己输入 Git 命令；维护者也可以按 Agent 更新说明完成操作。

收到更新结果后，重点确认：

- 自己的文档、图片、站点配置和定制得到保留。
- 原 Worker 名称、域名和文档源地址保持正确。
- Cloudflare 中已有的构建变量和机密继续保留，不需要导出机密。
- 本次需要的新功能已包含在更新中。

参数的含义和修改入口见[修改部署配置](./configuration.md)。

## 4. 确认网站更新成功

1. 在 Cloudflare 找到更新后新提交对应的构建记录，确认构建与部署均成功。
2. 打开原来的站点地址，检查首页、侧栏、搜索及本次需要的新功能。
3. 查看 **设置 → 构建 → 变量和机密**，确认参数仍为自己的值。

新增模板代码必须构建包含它的新提交。重试一个旧提交的构建，不会读取之后才合并的代码。如果没有自动触发，检查 Cloudflare 关联的仓库、生产分支和自动构建设置，或使用已配置的[构建挂钩](./deploy-hook.md)触发当前分支构建。

当前页脚和 `/_build.json` 展示的是文档源提交。只更新模板脚本时，这个值可能不变；应结合 Cloudflare 的部署仓库提交及实际页面功能确认更新结果。

如果更新请求还未合并，可以关闭它。合并后需要回退时，请 Agent 或维护者撤销对应更新请求的合并提交并重新部署；紧急情况下可先在 Cloudflare 恢复先前成功的部署，再同步处理仓库代码。
