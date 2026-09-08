---
title: Sidebar order
description: Order document pages, categories, and pages within categories, and understand the default sorting rules.
sidebar:
  label: Sidebar order
  order: 25
---

The left sidebar uses `sidebar.order` in each Markdown file's frontmatter. Smaller numbers appear first. Ordering applies only among siblings: set a category's position separately from the positions of pages inside it.

Edit these files in the document source selected by `DOCS_REPO`. This example uses `docs/`; `src/content/docs/` is generated, so do not maintain ordering there.

[中文文档](https://github.com/Azincc/nimbus-docs-template/blob/main/docs-zh-CN/sidebar-order.md)

## Order pages

Add or edit frontmatter between the opening pair of `---` lines. For example, [Writing documentation](./writing-docs.md) uses:

```md
---
title: Writing documentation
description: Write documentation pages in plain Markdown.
sidebar:
  label: Writing documentation
  order: 20
---

Start writing the page here.
```

`title` is the page title, `sidebar.label` is the sidebar name, and `sidebar.order` is its numeric position. You can omit `label` to use `title`. If frontmatter already exists, edit its `sidebar` field instead of adding a second block.

Use a number such as `20`, not a quoted string such as `"20"`. Indent YAML with spaces and align `label` with `order`.

Leave gaps with values such as `10, 20, 30…`. To insert a page between `20` and `30`, use `25`. This guide uses `25`, placing it after Writing documentation and before Site configuration.

## Order an entire category

This template configures a category through a Markdown file beside the directory, with the same name:

```text
docs/
├── deployment.md                 ← Configuration for the whole category
└── deployment/
    ├── configuration.md          ← Pages inside the category
    ├── private-repository.md
    ├── deploy-hook.md
    ├── template-update.md
    └── template-update-agent.md
```

The frontmatter in [deployment.md](./deployment.md) is:

```yaml
---
title: Deployment guide
description: Change deployment settings, connect private repositories, and configure automatic builds.
sidebar:
  order: 40
  group:
    label: Deployment guide
    hideIndex: true
---
```

`sidebar.order: 40` positions the entire category. `sidebar.group.label` sets its display name. `hideIndex: true` keeps the child-page list while hiding the category's overview link in the sidebar; the overview page remains accessible by URL.

Place `order` directly under `sidebar`, alongside `group`, rather than under `sidebar.group.order`. The category file can also contain an introduction and links to child pages, as in [Deployment guide](./deployment.md).

In this template, a `README.md` or `index.md` inside the directory cannot directly act as this category configuration file. Use `deployment.md` to configure the whole category. If `deployment/README.md` or `deployment/index.md` already exists, move its overview content into `deployment.md` and update references first, avoiding two files mapping to `/deployment`.

## Order pages within a category

Edit the frontmatter of each page in `deployment/`. For example, [Deployment configuration](./deployment/configuration.md) uses:

```yaml
---
title: Deployment configuration
sidebar:
  label: Deployment configuration
  order: 10
---
```

The deployment category currently has this order:

| File | `sidebar.order` | Sidebar label |
| --- | --- | --- |
| `deployment/configuration.md` | `10` | Deployment configuration |
| `deployment/private-repository.md` | `20` | Private repositories |
| `deployment/deploy-hook.md` | `30` | Deploy hooks |
| `deployment/template-update.md` | `40` | Updating the template |

The separate `deployment/template-update-agent.md` page is hidden from the sidebar and linked from the update guide.

A child page's `10` places it first within the deployment category. The category itself still uses `40` from `deployment.md`. Different categories can reuse `10, 20, 30` for their children.

## Current root order

| File | `sidebar.order` | Page or category |
| --- | --- | --- |
| `getting-started.md` | `10` | Quick start |
| `writing-docs.md` | `20` | Writing documentation |
| `sidebar-order.md` | `25` | Sidebar order |
| `site-config.md` | `30` | Site configuration |
| `deployment.md` | `40` | Deployment guide |
| `markdown-test.md` | `50` | Markdown test |

These files are all inside this example's `docs/` directory. Edit the corresponding root file to reposition a root item, or a file within the category directory to reposition a child page.

The default rules are:

- Ordinary pages without `sidebar.order` follow siblings with an explicit order.
- A category without an explicit order uses the smallest child `order`. If no child has an order either, the category follows siblings with explicit orders.
- Siblings with the same `order` are sorted by their sidebar display names. Use different numbers when their relative order must be fixed.

Setting an explicit `order` on the category file prevents new or reordered child pages from moving the whole category.

## Apply changes

Save, commit, and push the documents to `DOCS_BRANCH` in `DOCS_REPO`, then trigger a site build. Refresh after the build and deployment succeed to see the new sidebar order.

When documents and template code share the connected repository and build branch with automatic builds enabled, a push triggers the update. A separate source can trigger builds through a [Deploy hook](./deployment/deploy-hook.md). Local `pnpm dev` and `pnpm build` also read remote documents, so push changes first.

If the order has not changed, confirm that you edited the actual source, pushed the correct branch, and completed a new build. If only the order inside a category changed, check whether you edited a child page or the category file beside its directory.

Top navigation follows the order of the site JSON's `navigation` array, independently of `sidebar.order`. See [Site configuration](./site-config.md#navigation-and-sidebar).
