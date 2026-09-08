# Nimbus Docs Template

<img src="./assets/nimbus-mark.svg" alt="Official Nimbus logo" width="160" />

Publish Markdown from a GitHub repository as a documentation site with navigation, search, and theme switching. This site's content comes from the `docs/` directory in [nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template.git) itself, providing a working example of the template.

[中文文档](https://github.com/Azincc/nimbus-docs-template/tree/main/docs-zh-CN)

## Start here

- [Quick start](./getting-started.md): deploy on Cloudflare and configure build variables.
- [Writing documentation](./writing-docs.md): add pages, organize directories, and link images and documents.
- [Sidebar order](./sidebar-order.md): arrange pages, categories, and pages within categories.
- [Site configuration](./site-config.md): change the site name, navigation, theme, and branding.
- [Deployment configuration](./deployment/configuration.md): set the document source, site URL, logo, and favicon in Cloudflare without editing code.
- [Private repositories](./deployment/private-repository.md): create a read-only token and fetch private documents through a Cloudflare Build Secret.
- [Deploy hooks](./deployment/deploy-hook.md): connect a GitHub Webhook to a Cloudflare Deploy Hook so document pushes trigger builds.
- [Updating the template](./deployment/template-update.md): synchronize template updates after deployment, or give the separate agent instructions to an agent.
- [Markdown display test](./markdown-test/markdown-display-test.md): browse common Markdown styles in the Markdown test category.

## How this example works

At build time, the template fetches the document repository and converts Markdown in `docs/` into static pages. `README.md` becomes the home page; other files generate pages based on their paths. The build also generates the sidebar, table of contents, and search index.

This home page has no frontmatter. The template extracts its page title from the first heading. Other example pages use frontmatter for their titles, descriptions, and sidebar order. Relative `.md` links and the local SVG above are rewritten to site URLs during the build.

| Build variable | Value used by this example |
| --- | --- |
| `DOCS_REPO` | `https://github.com/Azincc/nimbus-docs-template.git` |
| `DOCS_BRANCH` | `main` |
| `DOCS_PATH` | `docs` |
| `DOCS_CONFIG_PATH` | `docs/site.json` |
| `SITE_URL` | `https://nimbus.az1n.com` |
| `SITE_LOGO` | `default`; site JSON image, then built-in Nimbus logo |
| `SITE_FAVICON` | `default`; site JSON image, then built-in Nimbus logo |

These are template defaults, so you only need to add build variables for values you want to override. You can explicitly clear `SITE_URL`; when deploying your own site, set it to your public URL. Setting this variable does not bind a domain.

The optional `SITE_LOGO` and `SITE_FAVICON` variables accept HTTP(S) image URLs or paths relative to the document repository root, such as `docs/assets/nimbus-mark.svg`. Build environment variables take precedence over defaults in `wrangler.jsonc`. The value `default` uses the corresponding JSON branding field, or the built-in official Nimbus logo (`/nimbus-logo.svg`) if that field is absent. Use `default` when Cloudflare requires a nonempty value. Empty values follow the same fallback; explicit image URLs and repository paths override JSON. Variable paths do not depend on the site JSON location, while paths in JSON remain relative to that file. Set ordinary variables under Cloudflare **Settings → Builds → Build variables and secrets**, then rebuild. Runtime variables do not automatically reach static builds. See [Branding](./site-config.md#branding).

Before using `default` in an older deployment, update its build scripts and `public/nimbus-logo.svg`. Changing build variables alone does not update the template.

## Document language

English documentation is published from `docs/` by default. The complete Chinese documentation is kept separately in [`docs-zh-CN/`](https://github.com/Azincc/nimbus-docs-template/tree/main/docs-zh-CN). To publish it instead, set `DOCS_PATH=docs-zh-CN` and `DOCS_CONFIG_PATH=docs-zh-CN/site.json`, then rebuild. These are separate document sources selected at build time; the template does not add a runtime language switcher.

## Content version

Each build reads a specific commit from the selected branch. The footer and `/_build.json` show that document commit's SHA so you can identify the published content. Push document changes, then trigger another build to publish them.

Maintain source documents in `docs/`. The `src/content/docs/`, `public/_source/`, and `dist/` directories are generated during builds. See the [repository README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.md) for deployment and maintenance instructions.
