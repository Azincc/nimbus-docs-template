---
title: 部署指南
description: 修改部署配置、连接私有文档仓库、设置自动构建，并更新已部署的模板。
sidebar:
  order: 40
  group:
    label: 部署指南
    hideIndex: true
---

首次部署请按[快速入门](./getting-started.md#部署到-cloudflare)操作。部署后的配置和维护可参考以下指南：

1. [修改部署配置](./deployment/configuration.md)：设置文档源、站点地址、Logo 和 favicon。
2. [私有仓库部署](./deployment/private-repository.md)：为私有文档源配置只读访问凭据。
3. [原文档仓库构建挂钩](./deployment/deploy-hook.md)：让独立文档仓库的推送自动触发站点构建。
4. [更新模板](./deployment/template-update.md)：在 GitHub 同步模板更新，或交给 Agent 协助完成，保留已有文档、配置和站点地址。
