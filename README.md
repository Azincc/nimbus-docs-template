# Nimbus Docs Template

<!-- deploy-button:start -->
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Azincc/nimbus-docs-template)
<!-- deploy-button:end -->

[中文说明](README.zh-CN.md) · [Live preview](https://nimbus.az1n.com)

<!-- dash-content-start -->

Publish Markdown from a GitHub repository as a documentation site on Cloudflare Workers. Keep documentation in its existing repository; each build fetches the configured branch and generates a static site with Nimbus and Astro.

- Public and private GitHub document sources.
- Automatic sidebar, table of contents, full-text search, and Markdown views.
- Light and dark themes, custom branding, navigation, and SEO settings.
- Plain Markdown input; no MDX or repository scripts are executed during the build.
- Document commit tracking in the footer and build metadata.

Built with Nimbus, Astro, Tailwind CSS, and Workers Static Assets.

<!-- dash-content-end -->

![Nimbus documentation site with sidebar navigation and a table of contents](.github/assets/preview.png)

## Deploy

1. Click **Deploy to Cloudflare** to create a template repository and Worker.
2. Confirm the build command is `pnpm run build`, the deploy command is `pnpm run deploy`, and the root directory is the template directory. Keep the three prefilled source values for the example, or enter your public repository, branch, and document directory.
3. Start the deployment. After it succeeds, open the resulting `workers.dev` address.

To change settings after deployment, open **Settings → Builds → Variables and secrets**, add or edit the relevant variables, save, then select **Retry build** in the build history.

Keeping the prefilled source values publishes this repository's [example docs](docs/README.md). Copying the template does not change `DOCS_REPO`; set it to publish your own documentation. Variables remain editable and take effect on the next build.

### Build variables

The initial Cloudflare deployment form contains only these three document-source fields. Keep their prefilled values to try the example, or replace them with your own repository, branch, and directory. Each displayed field needs a value.

| Variable | Prefilled value | Purpose |
| --- | --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` | GitHub HTTPS URL of the document repository |
| `DOCS_BRANCH` | `main` | Source branch |
| `DOCS_PATH` | `docs` | Document directory, relative to the source repository root; use `.` for the root |

The following settings are optional and do not appear in the initial deployment form. Add them later under **Settings → Builds → Variables and secrets** only when needed. Enter names and values separately, without quotes.

| Optional variable | Behavior when not set | When to add it |
| --- | --- | --- |
| `DOCS_CONFIG_PATH` | Read `site.json` in `DOCS_PATH` if present; otherwise use generic site settings | Your configuration file is elsewhere in the source repository |
| `SITE_URL` | No public origin is specified | You know the site's public URL and want origin-dependent SEO metadata and a sitemap |
| `SITE_LOGO` | Use the site JSON logo, then the built-in Nimbus logo | Override with an HTTP(S) image URL or path relative to the source repository root |
| `SITE_FAVICON` | Use the site JSON favicon, then the built-in Nimbus logo | Override with an HTTP(S) image URL or path relative to the source repository root |

You do not need to create a JSON file or add an empty variable to deploy. An explicitly configured `DOCS_CONFIG_PATH` must point to an existing valid JSON file. `SITE_URL` does not bind a domain; without it, the website remains accessible but omits origin-dependent canonical URLs, SEO metadata, and the sitemap. Unset branding falls back to `/nimbus-logo.svg`; existing `default` and empty branding values retain this behavior.

Use **Builds** variables: runtime **Variables & Secrets** are not automatically available during static builds. Save changes and rebuild to apply them.

For an older deployment, [update the template](docs/deployment/template-update.md) first. Existing explicit build variables still override the new defaults: delete an old `DOCS_CONFIG_PATH` to let the configuration follow `DOCS_PATH` automatically, and delete any other old optional values you want to stop overriding.

For a **private source repository**, add `DOCS_TOKEN` in the same **Builds → Variables and secrets** section, with type **Secret**. Use a GitHub token restricted to the source repository with **Contents: Read-only** permission. The token is used only for Git fetch; never put it in a repository file, URL, or ordinary variable. **The resulting website is public even when its source repository is private.** See the [private repository guide](docs/deployment/private-repository.md).

Pushes trigger builds when the documents and template share the connected repository and branch. For a separate source repository, connect a [Cloudflare Deploy Hook](docs/deployment/deploy-hook.md).

## Local development

Requires Git, Node.js **22.12.0 or later**, and **pnpm 10.2.0**.

```sh
git clone https://github.com/Azincc/nimbus-docs-template.git
cd nimbus-docs-template
pnpm install --frozen-lockfile
pnpm dev
```

Alternatively, run `npm ci` and `npm run dev`. Use `npm run <script>` for the other commands below.

Both development and production builds fetch the configured remote repository and require network access. To preview changes to local `docs/`, first push them to the configured source branch, then restart the command.

```sh
pnpm build
pnpm preview:cf
```

After reviewing the build, run `pnpm run deploy` to publish it with your Cloudflare credentials. The deploy script requires a successful build and rejects changed build artifacts.

| Command | Purpose |
| --- | --- |
| `pnpm build` | Build static pages and the search index |
| `pnpm preview:cf` | Preview built assets in the local Workers runtime |
| `pnpm run deploy` | Deploy previously built assets |
| `pnpm config:probe` | Inspect build settings and their sources |
| `pnpm test` | Run core tests |
| `pnpm check` | Check Astro and TypeScript after a build (`typecheck` is an alias) |
| `pnpm e2e:dev --port 8787` | Serve a completed build for browser tests |

## Documentation

English is the default. Start with the [quick start](docs/getting-started.md) or [configuration reference](docs/site-config.md). The complete [Chinese edition](docs-zh-CN/README.md) is also included.

To publish the Chinese edition, set `DOCS_PATH=docs-zh-CN`, then rebuild. The template automatically reads `docs-zh-CN/site.json`. If an older deployment explicitly sets `DOCS_CONFIG_PATH`, delete that variable or update it to `docs-zh-CN/site.json`.

Each build publishes one language. `locale` sets the HTML language; it does not translate pages or add a language switcher.

## Project

- The document root's `README.md` or `index.md` becomes `/`. If neither exists, the build generates an index.
- `docs/` and `docs-zh-CN/` contain English and Chinese example documents; `src/` contains the site UI; `scripts/` handles source fetching, conversion, building, and deployment.
- `src/content/docs/`, `public/_source/`, and `dist/` are generated. Maintain documents in the source repository.
- The footer and `/_build.json` record the document commit used by each build.
- Run `node scripts/configure-template.mjs <repository HTTPS URL>` to update deployment buttons after moving the template.

Licensed under [MIT](LICENSE). See [NOTICE.md](NOTICE.md) for upstream attribution.
