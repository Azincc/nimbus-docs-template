---
title: 私有仓库部署
description: 为私有 GitHub 文档源配置只读访问凭据，完成 Cloudflare 构建、发布与自动更新。
sidebar:
  label: 私有仓库部署
  order: 20
---

使用私有文档源，生成的站点仍不会自动变为私有。需要限制读者访问时，请另行配置 Cloudflare Access 等访问控制；模板不会自动配置。

这里使用公开模板创建 Worker，文档来自你自己的私有 GitHub 仓库。部署模板的 GitHub 授权、读取文档的 Token 和站点访问权限彼此独立。

## 1. 用公开模板创建 Worker

打开 [nimbus-docs-template 仓库 README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.md)，点击 Deploy to Cloudflare，完成 Cloudflare 与 GitHub 授权并创建模板副本及 Worker。

部署时确认以下构建配置，后续连接私有文档源时保持不变：

| 构建配置 | 值 |
| --- | --- |
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` |
| Root directory | 仓库根目录 |

如果创建界面没有 **Build variables and secrets** 入口，可以先用默认的公开示例创建 Worker，再按下文补充私有文档源变量和 Secret。已经填写私有仓库但首次拉取失败时，也可以在 Worker 创建后补齐配置并重试。

Cloudflare GitHub App 的授权用于连接和构建模板仓库，不等同于文档拉取脚本所需的私有仓库凭据。文档拉取脚本通过 `DOCS_TOKEN` 使用 GitHub Personal Access Token（PAT）执行 Git fetch。

## 2. 准备私有仓库中的文档

下文以私有仓库中的 `docs/` 目录为例，目录名不限制文档语言。如果将本模板的中文示例按原目录复制到私有仓库，使用的目录就是 `docs-zh-CN/`，构建变量 `DOCS_PATH`、`DOCS_CONFIG_PATH` 应分别设为 `docs-zh-CN`、`docs-zh-CN/site.json`。

在目标私有仓库的文档分支中创建 `docs/README.md`，写好标题和正文后提交。这个文件会成为站点首页。添加更多页面和图片的方法见[编写文档](../writing-docs.md)。

需要自定义站点名称、导航或品牌资源时，可以再添加 `docs/site.json`。最小配置为：

```json
{
  "schemaVersion": 1
}
```

其他字段按需添加，详见[站点配置](../site-config.md)。没有配置文件时，稍后需将 `DOCS_CONFIG_PATH` 显式设为空字符串。省略这个变量会继承模板默认的 `docs/site.json` 路径。

从私有仓库的 **Code → HTTPS** 复制 HTTPS 克隆地址，地址中不要添加 Token。同时记下文档所在分支，以及文档目录、配置文件相对于仓库根目录的路径。

## 3. 创建只读 GitHub Token

使用具有目标私有仓库读取权限的 GitHub 账号：

1. 打开个人 **Settings → Developer settings → Personal access tokens → Fine-grained tokens**，选择 **Generate new token**。
2. 填写便于识别的 Token 名称和到期时间，组织可能限制最长有效期。Token 到期后，构建将无法继续读取私有仓库，需要更新凭据。
3. 在 **Resource owner** 选择私有仓库所属的个人账号或组织。
4. 在 **Repository access** 选择 **Only select repositories**，仅勾选目标私有文档仓库。
5. 在 **Repository permissions** 将 **Contents** 设为 **Read-only**。GitHub 会自动提供所需的 **Metadata: Read-only**，不需要写入权限。
6. 生成 Token。若组织要求审批，需等待组织管理员批准后才能用于构建。处于 pending 状态的 Token 不能读取该组织的私有内容。

下一步将生成的 Token 保存到 Cloudflare 构建 Secret，不要写入文档、仓库配置、Git URL 或聊天消息。若无法选择目标组织或仓库，先检查账号权限，并确认组织允许使用 fine-grained PAT。

## 4. 配置构建变量和 Secret

打开目标 Worker 的 **Settings → Builds → Build variables and secrets**，按下表配置。文档源与站点参数使用普通变量，其中 Logo 和 favicon 可选；`DOCS_TOKEN` 单独选择 **Secret** 类型。

| 名称 | 类型 | 填写内容 |
| --- | --- | --- |
| `DOCS_REPO` | Variable | 目标私有 GitHub 仓库的 HTTPS 克隆地址，不含用户名、密码或 Token |
| `DOCS_BRANCH` | Variable | 私有文档所在分支；若使用 `main`，可继承默认值 `main` |
| `DOCS_PATH` | Variable | 相对私有仓库根目录的文档目录；上述结构为 `docs`，也是默认值 |
| `DOCS_CONFIG_PATH` | Variable | 有配置文件时填 `docs/site.json` 或实际路径；没有 JSON 文件时显式置空 |
| `SITE_URL` | Variable | 默认 `https://nimbus.az1n.com`；可覆盖为自己站点包含 `https://` 的实际地址，也可显式置空 |
| `SITE_LOGO` | Variable，可选 | Logo 的 HTTP(S) 图片 URL 或相对私有文档源仓库根目录的路径，例如 `docs/assets/nimbus-mark.svg`；默认空 |
| `SITE_FAVICON` | Variable，可选 | favicon 的 HTTP(S) 图片 URL 或相对私有文档源仓库根目录的路径，例如 `docs/assets/nimbus-mark.svg`；默认空 |
| `DOCS_TOKEN` | Secret | 上一步生成且已获得所需组织批准的只读 GitHub Token |

未设置同名构建变量时，模板会读取 `wrangler.jsonc` 中的公开默认值。仍适用的默认值无需重复填写，但 `DOCS_REPO` 必须改为你的私有仓库地址，否则仍会读取公开示例。

`SITE_LOGO` 和 `SITE_FAVICON` 的最终值非空时，分别覆盖 JSON 的 `brand.logo` 和 `brand.favicon`；最终值为空时，沿用 JSON 中的设置。

这两个变量的路径都相对于 `DOCS_REPO` 仓库根目录，与站点 JSON 是否存在、存放在哪里无关。JSON 内的本地资源路径仍相对于 JSON 文件。构建可以用同一个只读 Token 读取仓库图片，无需额外添加图片凭据。

`SITE_URL` 不会自动绑定域名，使用自己的正式地址前需先完成域名配置。暂时留空也能浏览站点，但不会生成依赖正式站点地址的 canonical、SEO 输出和 sitemap。

这里的 **Build variables and secrets** 供构建进程使用。普通 **Settings → Variables & Secrets** 设置的是 Worker 运行时变量和 Secret，不会自动传给静态构建。因此，只在运行时区域填写 `DOCS_TOKEN`，文档拉取仍无法获得认证。Logo 和 favicon 的普通构建变量也需要保存后重新构建才会生效。

保存后，在构建记录中选择 **Retry build**。如果初始部署没有 Build Secret 入口，就在 Worker 创建后补齐上述配置，再重试构建，完成私有文档的首次构建。后续更换文档源或 Token，也在这里修改变量和 Secret，构建命令、部署命令及根目录保持不变。

## 5. 确认首次发布

构建和部署成功后，检查以下几项：

- 查看构建日志中的文档提交 SHA，核对它是否对应私有仓库所选分支的提交。这是文档源版本，不一定与 Cloudflare 显示的模板仓库提交相同。
- 打开 Worker 的站点地址，确认首页显示私有源中的正文，文档链接和图片可以访问。
- 查看页脚或 `/_build.json` 中的提交 SHA，确认线上页面使用的是本次读取的文档版本。

如果站点仍是默认示例，先检查 **Build variables** 中的 `DOCS_REPO` 是否保存到了当前 Worker，再重新触发构建。

## 6. 让文档推送触发更新

表单各字段的说明、推送验证和故障排查见[原文档仓库构建挂钩](./deploy-hook.md)。公开与私有仓库的触发流程相同，私有文档仍通过构建 Secret 中的 `DOCS_TOKEN` 读取。

私有文档源与 Builds 关联的模板仓库分开存放时，需要将原文档仓库的 push 连接到 Cloudflare Deploy Hook。首次构建不依赖 Webhook，发布成功后再配置即可：

1. 在 Worker 的 **Settings → Builds → Deploy Hooks** 创建 Hook，选择模板仓库的构建分支，复制生成的 URL。
2. 打开私有文档仓库的 **Settings → Webhooks → Add webhook**，按下表填写并保存。管理 Webhook 需要相应的仓库管理权限，与只读文档 Token 的权限分开管理。

| Webhook 字段 | 值 |
| --- | --- |
| Payload URL | Cloudflare Deploy Hook 生成的 URL |
| Content type | `application/json` |
| Secret | 留空；不要在此填写 `DOCS_TOKEN` |
| Events | `Just the push event` |

Deploy Hook URL 本身就是触发凭据，请保存在 Webhook 设置中，不要提交到仓库。`DOCS_TOKEN` 仅用于构建时读取文档，不能用作此流程的 Webhook Secret。

向 `DOCS_BRANCH` 对应分支推送一次文档修改，先在 GitHub Webhook 的 **Recent Deliveries** 查看请求结果，再到 Cloudflare 查看新构建，并检查站点内容。Hook 选择的是模板分支，读取哪个文档分支则由 `DOCS_BRANCH` 决定，二者可以不同。

文档与模板若已在同一个 Builds 关联仓库、同一个分支，仓库自身的 push 会触发构建，无需重复设置这条 Webhook 链路。

## 7. 更新或更换 Token

Token 到期、被撤销或需要轮换时，按第 3 步创建新的只读 Token。完成组织审批后，更新该 Worker 的 **Build variables and secrets → DOCS_TOKEN**，保存并重新构建。确认新凭据可用，再撤销不再使用的旧 Token。

更换私有仓库时，同时更新 `DOCS_REPO`，并确保新 Token 的 **Resource owner** 和所选仓库覆盖新的文档源。无需把 Token 写回模板仓库，也无需修改 Webhook Secret。

## 常见问题

| 现象 | 检查与处理 |
| --- | --- |
| 私有仓库拉取失败、提示找不到仓库或无权限 | 核对 HTTPS 仓库地址、分支是否存在，以及 `DOCS_TOKEN` 是否位于当前 Worker 的构建 Secret；确认 Token 未过期、选中了目标仓库、具备 Contents 只读权限且组织已批准 |
| 报告 `DOCS_CONFIG_PATH` 或 JSON 错误 | 路径以私有仓库根目录为基准；没有配置文件时显式置空，有文件时检查 JSON 格式和 `schemaVersion: 1` |
| 页面或图片在构建时提示不存在 | 确认文件已提交到 `DOCS_BRANCH`，检查 `DOCS_PATH`、大小写和相对链接，参见[编写文档](../writing-docs.md) |
| 修改了变量或 Secret，站点没有更新 | 保存后重新触发构建；检查新构建的文档 SHA，不仅查看旧的部署结果 |
| GitHub push 后没有新构建 | 检查 Webhook 最近一次投递、Deploy Hook URL 和关联模板分支；确认修改已推送到构建读取的文档分支 |

## 官方参考

- [Cloudflare Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [GitHub Personal Access Token 管理说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

返回[快速入门](../getting-started.md)或[首页](../README.md)。
