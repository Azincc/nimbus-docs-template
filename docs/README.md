# Nimbus Docs Template

<img src="./assets/nimbus-mark.svg" alt="Official Nimbus logo" width="160" />

Publish Markdown from a GitHub repository as a documentation site with navigation, search, and theme switching. This site's content comes from the `docs/` directory in [nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template.git) itself, providing a working example of the template.

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

These are the only three fields in the initial Cloudflare deployment form. Keep the prefilled values for this example, or enter your own source. The template automatically reads `site.json` in the selected `DOCS_PATH`; if the file does not exist, it uses generic site settings. No empty variable is needed.

Optional settings do not appear in the initial form. Add `DOCS_CONFIG_PATH` later only if the JSON is stored elsewhere. Add `SITE_URL` after confirming your public address; it does not bind a domain. Without `SITE_URL`, the website remains accessible but omits origin-dependent canonical URLs, SEO metadata, and the sitemap.

The optional `SITE_LOGO` and `SITE_FAVICON` variables accept HTTP(S) image URLs or paths relative to the document repository root, such as `docs/assets/nimbus-mark.svg`. When unset, they use the corresponding JSON branding field, or the built-in official Nimbus logo (`/nimbus-logo.svg`) if that field is absent. Existing `default` and empty values follow the same fallback; explicit image URLs and repository paths override JSON. Variable paths do not depend on the site JSON location, while paths in JSON remain relative to that file. Add ordinary variables under Cloudflare **Settings → Builds → Build variables and secrets**, then rebuild. Runtime variables do not automatically reach static builds. See [Branding](./site-config.md#branding).

Older deployments must [update the template](./deployment/template-update.md) to get these defaults. Saved build variables still override them; delete old optional values when you want the new default behavior.

## Document language

English documentation is published from `docs/` by default. The complete Chinese documentation is kept separately in [`docs-zh-CN/`](https://github.com/Azincc/nimbus-docs-template/tree/main/docs-zh-CN). To publish it instead, set `DOCS_PATH=docs-zh-CN`, then rebuild; `docs-zh-CN/site.json` is discovered automatically. Delete or update any existing explicit `DOCS_CONFIG_PATH` first. These are separate document sources selected at build time; the template does not add a runtime language switcher.

## Content version

Each build reads a specific commit from the selected branch. The footer and `/_build.json` show that document commit's SHA so you can identify the published content. Push document changes, then trigger another build to publish them.

Maintain source documents in `docs/`. The `src/content/docs/`, `public/_source/`, and `dist/` directories are generated during builds. See the [repository README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.md) for deployment and maintenance instructions.
