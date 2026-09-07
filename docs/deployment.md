---
title: 部署指南
description: 修改部署配置、连接私有文档仓库，并设置文档推送后的自动构建。
sidebar:
  order: 40
  group:
    label: 部署指南
    hideIndex: true
---

首次部署步骤见[快速入门](./getting-started.md#部署到-cloudflare)。部署后，可以按以下顺序完善站点：

1. [修改部署配置](./deployment/configuration.md)：设置文档源、站点地址、Logo 和 favicon。
2. [私有仓库部署](./deployment/private-repository.md)：为私有文档源配置只读访问凭据。
3. [原文档仓库构建挂钩](./deployment/deploy-hook.md)：让独立文档仓库的推送自动触发站点构建。
