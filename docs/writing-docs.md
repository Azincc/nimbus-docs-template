---
title: Writing documentation
description: Write pages in plain Markdown, organize directories, and add relative links and local images.
sidebar:
  label: Writing documentation
  order: 20
---

Maintain `.md` files in the document source repository's `docs/` directory. The template discovers pages automatically, leaves the originals unchanged, and writes build content only to temporary and generated directories.

[中文文档](https://github.com/Azincc/nimbus-docs-template/blob/main/docs-zh-CN/writing-docs.md)

## Organize pages

This example has the following structure:

```text
docs/
├── README.md
├── getting-started.md
├── writing-docs.md
├── sidebar-order.md
├── site-config.md
├── deployment.md
├── deployment/
│   ├── configuration.md
│   ├── private-repository.md
│   ├── deploy-hook.md
│   ├── template-update.md
│   └── template-update-agent.md
├── markdown-test.md
├── markdown-test/
│   └── markdown-display-test.md
├── site.json
└── assets/
    └── nimbus-mark.svg
```

| Document path | Site route |
| --- | --- |
| `docs/README.md` | `/` |
| `docs/getting-started.md` | `/getting-started` |
| `docs/writing-docs.md` | `/writing-docs` |
| `docs/sidebar-order.md` | `/sidebar-order` |
| `docs/site-config.md` | `/site-config` |
| `docs/deployment.md` | `/deployment` |
| `docs/deployment/configuration.md` | `/deployment/configuration` |
| `docs/deployment/private-repository.md` | `/deployment/private-repository` |
| `docs/deployment/deploy-hook.md` | `/deployment/deploy-hook` |
| `docs/deployment/template-update.md` | `/deployment/template-update` |
| `docs/deployment/template-update-agent.md` | `/deployment/template-update-agent` |
| `docs/markdown-test.md` | `/markdown-test` |
| `docs/markdown-test/markdown-display-test.md` | `/markdown-test/markdown-display-test` |

A subdirectory can also contain `README.md` or `index.md` as its landing page. Keep only one of these in each directory to avoid competing for the same route. Regular files generate lowercase slugs from their paths.

See [Markdown display test](./markdown-test/markdown-display-test.md) for rendered examples of common syntax.

## Titles and sidebar

Plain Markdown can begin with an H1, as on this example's [home page](./README.md). The template extracts the page title from the first heading.

To set a description, sidebar label, or order, add frontmatter at the start of the file:

```md
---
title: Writing documentation
description: Maintain documentation pages with Markdown.
sidebar:
  label: Writing documentation
  order: 20
---

Start writing the page here.

## Add content

Use ordinary Markdown headings, lists, tables, and code blocks.
```

The page displays `title` as its main heading, so you do not need to repeat it in the body. The sidebar includes pages automatically; smaller `sidebar.order` values appear first.

This example uses `10, 20, 30…` to order siblings, leaving space to insert new pages. A category's position is controlled by a Markdown file beside the directory with the same name. For example, [deployment.md](./deployment.md) positions the entire Deployment guide category, while each page's `sidebar.order` inside `deployment/` controls its position within that category.

See [Sidebar order](./sidebar-order.md) for step-by-step instructions, complete examples, and the current document order.

Non-index pages can set `slug` to customize their route, such as `slug: writing-docs`. Do not add leading or trailing `/` characters. Directory landing pages keep their automatic mapping and should not set a custom slug.

## Relative links

Write links using paths between document files:

```md
[Quick start](./getting-started.md)
[Site configuration](./site-config.md)
[Home](./README.md)
```

The build rewrites these links to their corresponding site pages and preserves heading anchors after `#`. For example: [Site theme](./site-config.md#theme).

Target files must exist. Markdown outside the selected document directory does not become a page on this site. Use full GitHub URLs when linking to the repository README or the separate [Chinese documentation](https://github.com/Azincc/nimbus-docs-template/tree/main/docs-zh-CN).

## Images and assets

Image paths are relative to the Markdown file that references them. This example's home page uses `docs/assets/nimbus-mark.svg`:

```md
![Official Nimbus logo](./assets/nimbus-mark.svg)
```

The template copies referenced local assets and rewrites their URLs. Images can live in other ordinary directories in the source repository, but paths cannot escape the repository. Hidden files, hidden directories, and symbolic links are not published.

You can also set the logo and favicon through the optional ordinary build variables `SITE_LOGO` and `SITE_FAVICON`. They accept HTTP(S) image URLs or paths relative to the `DOCS_REPO` repository root, such as `docs/assets/nimbus-mark.svg`, regardless of the site JSON location. Local `brand.logo` and `brand.favicon` paths in JSON remain relative to the JSON file. A final nonempty build variable overrides the corresponding JSON field; an empty value inherits JSON. Save the variables in Cloudflare Builds and rebuild to apply them. See [Branding](./site-config.md#branding).

## Publish updates

Commit and push document changes, then trigger a site build. The build regenerates pages and the sidebar; deleted files disappear from the next output. If the top navigation explicitly references a deleted page, also update `docs/site.json`.

A separate document source can use a [Deploy hook](./deployment/deploy-hook.md) to rebuild automatically after a push.

The current document input handles `.md` files and ignores `.mdx`. It does not execute JavaScript or MDX components from the document source. To change template code, edit the template project itself and consult the [repository maintenance instructions](https://github.com/Azincc/nimbus-docs-template/blob/main/AGENT.md).

Continue to [Site configuration](./site-config.md), or [return home](./README.md).
