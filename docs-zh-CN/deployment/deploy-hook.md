---
title: 原文档仓库构建挂钩
description: 将原文档仓库的 GitHub push 事件连接到 Cloudflare Deploy Hook，自动构建并发布最新文档。
sidebar:
  label: 构建挂钩
  order: 30
---

Deploy Hook 在 Cloudflare 创建，Webhook 在 `DOCS_REPO` 指定的原文档仓库创建。连接后，原文档仓库的 push 会触发模板重新构建并发布最新内容，公开和私有文档源都可以使用这一流程。

```text
原文档仓库 push
  → GitHub Webhook
  → Cloudflare Deploy Hook
  → 构建模板仓库的指定分支
  → 拉取 DOCS_BRANCH 的最新文档
  → 构建成功后发布站点
```

## 开始前

先完成站点的首次成功构建，确认 Worker 的 Builds 已连接模板仓库，并且能正确读取 `DOCS_REPO`、`DOCS_BRANCH` 和文档路径。添加原仓库 Webhook 的账号还需要具有该仓库的 Webhook 管理权限。

文档与模板在同一个 Builds 关联仓库、同一个构建分支时，仓库原有的 push 构建即可更新文档，无需额外 Hook。文档源位于独立仓库，或使用不同分支且没有对应的原生构建触发时，按下文连接。

私有原文档仓库需要先配置 `DOCS_TOKEN` 构建 Secret，见[私有仓库部署](./private-repository.md)。Deploy Hook 负责触发构建，不提供读取私有文档的权限。

## 1. 在 Cloudflare 创建 Deploy Hook

1. 打开 **Workers & Pages → 目标 Worker → Settings → Builds → Deploy Hooks**。
2. 创建一个 Hook，输入便于识别用途的名称，例如“原文档更新”。
3. 选择需要构建的**模板仓库分支**。该分支必须包含可用的模板代码及构建配置。
4. 创建后复制 Cloudflare 生成的实际 Hook URL，下一步将它填入 GitHub。

这里选择的是模板构建分支。构建脚本读取的原文档分支由 `DOCS_BRANCH` 决定，二者是独立配置，可以不同。

现有 Build command、Deploy command 和 Root directory 保持不变。此流程直接使用 GitHub Webhook 与 Cloudflare Deploy Hook，无需新增接收接口或 GitHub Actions 工作流。

## 2. 在原文档仓库创建 Webhook

打开 `DOCS_REPO` 对应的 GitHub 仓库，进入 **Settings → Webhooks → Add webhook**。确认当前是维护 Markdown 的原文档仓库；如果模板和文档分开存放，不要误填到模板仓库中。

| 字段 | 配置 |
| --- | --- |
| Payload URL | 上一步复制的 Cloudflare Deploy Hook 实际 URL |
| Content type | `application/json` |
| Secret | 留空，不填写 `DOCS_TOKEN` |
| Which events would you like to trigger this webhook? | `Just the push event` |
| Active | 保持启用 |
| SSL verification | 保持启用 |

保存 Webhook。GitHub 可能发送一次 `ping` 来检查连接，这不代表文档已经完成自动更新。

Hook URL 本身就是触发凭据，只保存到需要使用它的 Webhook 设置中，不写入公开变量、文档或仓库。`DOCS_TOKEN` 仅保存在 Cloudflare **Build variables and secrets** 中并选择 **Secret** 类型；它用于 Git fetch，不能作为这个流程的 Webhook Secret。

## 3. 验证一次文档更新

向 `DOCS_BRANCH` 对应的原文档分支提交并推送一处容易辨认的正文修改，然后依次检查：

1. 在 GitHub 仓库的 **Settings → Webhooks → 对应 Webhook → Recent Deliveries** 中找到这次 `push` 投递，查看响应状态。`2xx` 只表示 Hook 接收了请求，不表示构建或发布已经成功。
2. 在目标 Worker 的 **Builds** 中查看对应的新构建，确认模板构建和部署均成功；失败时先查看构建日志。
3. 打开站点，确认修改后的正文以及相关页面链接、图片正常显示。
4. 对照构建日志、站点页脚或 `/_build.json` 中的文档提交 SHA，确认发布的文档版本。

构建执行时会拉取 `DOCS_BRANCH` 的最新提交，不会把 Webhook 事件中的提交 SHA 固定为本次文档版本。如果短时间内连续推送多次，实际读取的 SHA 可能比触发事件的提交更新，应以构建记录和站点展示的 SHA 为准。

一次 `ping` 成功或一次 `push` 获得 `2xx` 都不能替代上述页面更新检查。实际是否完成自动发布，需要结合 Cloudflare 构建结果和站点内容判断。

## 分支与重复触发

GitHub 仓库级 `push` Webhook 也可能收到其他分支的推送，或仅修改非文档文件的推送，从而触发额外构建。本流程没有按文件路径过滤事件，构建始终读取配置的 `DOCS_BRANCH`。

因此，向其他分支推送成功并不表示那条分支的文档会出现在站点中。需要更换文档分支时，修改 Cloudflare 构建变量 `DOCS_BRANCH` 或模板仓库中的公开默认值，再重新构建。

同一个 Hook 的前次构建仍处于 `queued` 或 `initializing` 时，重复请求会返回已有构建及 `already_exists: true`，不一定新建一条构建记录。前次构建离开这两个阶段后，后续请求仍可能创建新构建。

## 更换或移除 Hook

需要更换 Hook 时，先在 Cloudflare 新建 Hook，将 GitHub Webhook 的 Payload URL 更新为新 URL，保存并验证一次文档推送。确认新连接可用后，再移除旧 Hook。

不再需要原文档仓库触发构建时，停用或删除对应的 GitHub Webhook，并移除不再使用的 Cloudflare Hook。更新私有仓库 Token 仍在 Build Secret 中进行，与更换 Hook 分开处理。

## 常见问题

| 现象 | 检查与处理 |
| --- | --- |
| 推送后没有 `push` 投递记录 | 确认 Webhook 建在 `DOCS_REPO` 对应的原文档仓库，已选择 push 事件且 Active 启用，并确认修改已推送到 GitHub |
| 投递响应不是 `2xx` | 核对 Payload URL 是否完整且对应仍有效的 Cloudflare Hook，检查响应内容；SSL verification 保持启用 |
| 投递成功但没有看到成功部署 | 在目标 Worker 的 Builds 中查看队列和构建日志；Webhook 成功不等于构建成功 |
| 构建无法读取私有仓库 | 检查 `DOCS_TOKEN` 是否为当前 Worker 的构建 Secret、是否过期及是否具有目标仓库读取权限，见[私有仓库部署](./private-repository.md) |
| 构建成功但文档没变化 | 核对 `DOCS_REPO`、`DOCS_BRANCH`、`DOCS_PATH`，确认修改已推送到实际读取的分支，并比较文档提交 SHA |
| 非文档修改也触发了构建 | 仓库级 push 事件不按文档路径过滤，这是当前连接方式的行为 |

## 官方参考

- [Cloudflare Workers Builds Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)
- [GitHub 创建 Webhook](https://docs.github.com/en/webhooks/using-webhooks/creating-webhooks)

返回[快速入门](../getting-started.md)或[首页](../README.md)。
