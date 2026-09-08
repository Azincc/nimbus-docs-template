---
title: Quick start
description: Deploy a documentation site and configure build variables in Cloudflare without writing code.
sidebar:
  label: Quick start
  order: 10
---

Deploy and change settings in the Cloudflare dashboard without installing development tools or editing code. By default, the template reads `docs/` on the `main` branch of the [example repository](https://github.com/Azincc/nimbus-docs-template.git). You can switch to your own document repository after deployment.

[中文文档](https://github.com/Azincc/nimbus-docs-template/blob/main/docs-zh-CN/getting-started.md)

## Deploy to Cloudflare

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Azincc/nimbus-docs-template)
<!-- deploy-button:end -->

1. Click **Deploy to Cloudflare** above. Follow the prompts to authorize GitHub and create your template repository and Worker.
2. Use `pnpm run build` as the build command and `pnpm run deploy` as the deploy command. Set the root directory to the repository root.
3. Open the Worker's **Settings → Builds → Variables and secrets**, click **Add**, and enter the variables you want to change using the next section.
4. Save, then select **Retry build** in the build history. After it succeeds, open the `workers.dev` address provided by Cloudflare.

To change the document source, site URL, logo, or favicon later, edit the same variables, save, and rebuild.

The first deployment may show the example documents. A message saying no build variables or secrets are configured means you have not added them in the dashboard; the template still uses its defaults. Copying the template does not automatically change the document source to your repository.

## Build variables

All seven values below can be ordinary variables in **Builds → Variables and secrets**. Add only the values you want to change; omitted variables inherit the template defaults.

Enter **names and values in their separate fields, without quotes**. For example, enter `DOCS_BRANCH` as the name and `main` as the value.

| Variable | Default | What to enter |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | Your document repository's HTTPS URL, such as `https://github.com/your-user/your-docs.git` |
| `DOCS_BRANCH` | `main` | The branch containing the documents |
| `DOCS_PATH` | `docs` | The document directory; use `.` if documents are at the repository root |
| `DOCS_CONFIG_PATH` | `docs/site.json` | The site configuration path; add this variable with an empty value if there is no configuration file |
| `SITE_URL` | `https://nimbus.az1n.com` | Your complete public URL, such as `https://your-worker.your-subdomain.workers.dev`; add an empty value until known |
| `SITE_LOGO` | Empty | Optional HTTP(S) logo image URL or image path in the repository |
| `SITE_FAVICON` | Empty | Optional HTTP(S) favicon image URL or image path in the repository |

To set an empty value, clear the value field; **do not enter two quotation marks `""`**. Omitting a variable inherits its default. Adding the variable with an empty value overrides that default.

`SITE_URL` controls search-engine metadata and **does not bind a custom domain**. The site remains accessible when it is empty, but origin-dependent canonical URLs and the sitemap are omitted.

`SITE_LOGO` and `SITE_FAVICON` can be omitted. Nonempty values override the branding in the site configuration; empty values inherit it. Repository image paths start at the document repository root, for example `docs/assets/nimbus-mark.svg`. See [Branding](./site-config.md#branding).

Older deployment copies may not support these image variables yet. Update their template build scripts first; adding variables alone does not upgrade a copy.

Public repositories do not need `DOCS_TOKEN`. For a private document repository, add `DOCS_TOKEN` in the same **Builds → Variables and secrets** section and select **Secret**. Use a GitHub token restricted to the source repository with **Contents: Read-only** permission. The token is used only for Git fetch and must not be written into repository files or URLs. See [Private repositories](./deployment/private-repository.md).

Make sure these are **build** variables. Ordinary runtime variables are not automatically available to the build. After saving changes, select **Retry build** to update the site. See [Deployment configuration](./deployment/configuration.md) for the detailed dashboard steps.

When documents and template code share the connected build repository and branch, pushing documents triggers a build. For a separate document repository, connect automatic updates with a [Deploy hook](./deployment/deploy-hook.md).

The default source is the English `docs/` directory. To publish the [Chinese documentation](https://github.com/Azincc/nimbus-docs-template/tree/main/docs-zh-CN) instead, set `DOCS_PATH` to `docs-zh-CN` and `DOCS_CONFIG_PATH` to `docs-zh-CN/site.json`, then rebuild. This selects the published document language at build time.

## Local development

To develop the template locally, install Git, Node.js 22.12.0 or later, and pnpm 10.2.0, then run:

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

You can also use npm: run `npm ci` to install dependencies, then `npm run dev`. Replace `pnpm <script>` with `npm run <script>` for the other commands below.

Open the local URL printed in the terminal. The development command first fetches the documents from GitHub, so it requires network access.

Both `pnpm dev` and `pnpm build` read the configured remote repository. Editing local `docs/` does not change the remote document version. Push changes to the configured repository and branch before running the command again.

## Build and preview

```sh
pnpm build
pnpm preview:cf
```

The build fetches documents, converts Markdown and assets, validates site settings, generates static pages, and creates the search index. If a local link is missing or site configuration is invalid, fix the source files before rebuilding.

Open [Writing documentation](./writing-docs.md) and [Site configuration](./site-config.md) in the preview to inspect the example pages, relative links, and theme. The footer shows the document commit SHA used by this build.

After reviewing the output, run `pnpm run deploy` to publish it to Cloudflare. This requires Cloudflare deployment authorization. The deploy command accepts only successfully built, unchanged artifacts; run `pnpm build` again after changing the site.

For template development, run core tests with `pnpm test` and check Astro and TypeScript after building with `pnpm check` (`pnpm typecheck` is an alias). Use `pnpm e2e:dev --port 8787` to serve completed build artifacts for browser tests.

Continue to [Writing documentation](./writing-docs.md), or [return home](./README.md).
