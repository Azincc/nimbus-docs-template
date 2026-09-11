---
title: 更新已部署的模板
description: 更新已部署站点的模板，了解如何请 Agent 协助，并确认网站是否更新成功。
audience: human
sidebar:
  label: 更新模板
  order: 40
---

使用模板创建站点后，你的部署仓库中会保存一份模板代码。官方模板有更新时，把更新同步到这个仓库，再由 Cloudflare 构建和发布。

沿用原来的部署仓库和 Worker，可以保留已有域名及 Cloudflare 中的构建变量和机密。如果需要 Agent 协助，让它阅读单独的 [Agent 更新说明](./template-update-agent.md)。

## 1. 找到需要更新的仓库

打开 Cloudflare 的 **Workers 和 Pages → 你的 Worker → 设置 → 构建**，查看 **Git 存储库** 和 **生产分支**。请在这里关联的部署仓库中更新模板代码。

`DOCS_REPO` 指向保存 Markdown、图片和站点配置的文档源仓库。它可以与部署仓库相同，也可以是另一个仓库。只更新文档源，或在 Cloudflare 重试构建，都不会自动同步官方模板代码。

打开部署仓库的 GitHub 页面，根据仓库类型选择更新方法：

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

只有 Fork 自官方模板的仓库才能使用这个入口。独立副本目前没有内置“同步模板”工作流，按下一节操作即可。

## 3. 独立副本：交给 Agent 协助

准备以下信息：

- Cloudflare 关联的部署仓库地址。
- 实际生产分支和 Worker 名称。
- 原站点的访问地址。
- 希望保留的定制，例如自己的文档、图片、主题或页面修改。

打开 [Agent 更新说明](./template-update-agent.md)，点击 **View as Markdown**，把打开的链接和上述信息交给能够访问仓库的 Agent。也可以点击 **Copy page**，复制完整操作说明。

告诉 Agent 要做到哪一步：先准备更新供你检查，还是继续推送、合并和发布。也可以请维护者按 Agent 更新说明操作，你不需要自己输入 Git 命令。

收到更新结果后，核对以下内容：

- 自己的文档、图片、站点配置和定制都已保留。
- 原 Worker 名称、域名和文档源地址保持正确。
- Cloudflare 中原有的构建变量和机密已保留，无需导出机密。
- 本次需要的新功能已包含在更新中。

参数的含义和修改入口见[修改部署配置](./configuration.md)。

## 4. 确认网站更新成功

1. 在 Cloudflare 找到更新后新提交对应的构建记录，确认构建与部署均成功。
2. 打开原来的站点地址，检查首页、侧栏、搜索及本次需要的新功能。
3. 查看 **设置 → 构建 → 变量和机密**，确认参数仍为自己的值。

模板代码更新后，要构建包含这些改动的新提交。重试旧提交不会读取后来合并的代码。如果没有自动触发构建，检查 Cloudflare 关联的仓库、生产分支和自动构建设置。也可以使用已配置的[构建挂钩](./deploy-hook.md)触发当前分支构建。

当前页脚和 `/_build.json` 展示的是文档源提交。只更新模板脚本时，这个值可能不变。请结合 Cloudflare 显示的部署仓库提交和实际页面功能，确认模板是否已更新。

更新请求尚未合并时，可以直接关闭。合并后需要回退，请 Agent 或维护者撤销对应更新请求的合并提交，再重新部署。紧急情况下，可以先在 Cloudflare 恢复先前成功的部署，然后同步处理仓库代码。
