---
title: Site configuration
description: Configure the name, navigation, theme, and branding of a Nimbus documentation site.
sidebar:
  label: Site configuration
  order: 30
---

At build time, the template reads JSON configuration from the document source repository, validates it, and applies it to the site. You can also set the logo and favicon with optional build variables. The template does not load `astro.config.*` or execute JavaScript or MDX from the document source.

## This example's configuration

This repository stores its configuration in `docs/site.json`. When `DOCS_CONFIG_PATH` is unset, the template automatically looks for `site.json` inside `DOCS_PATH`; with the default `DOCS_PATH=docs`, it reads this file. If no file exists, it uses generic site settings. The initial deployment form does not ask for `DOCS_CONFIG_PATH`.

For a configuration file stored elsewhere, add `DOCS_CONFIG_PATH` as a build variable after deployment. Explicit paths are relative to the source repository root, independently of `DOCS_PATH`, and must point to an existing file.

```json
{
  "schemaVersion": 1,
  "title": "Nimbus Docs Template",
  "description": "Build documentation from GitHub Markdown; this repository's docs/ directory is a complete example.",
  "locale": "en",
  "homeLabel": "Home",
  "github": "https://github.com/Azincc/nimbus-docs-template.git",
  "navigation": [
    { "label": "Home", "link": "/" },
    { "label": "Quick start", "link": "/getting-started" },
    { "label": "中文", "link": "https://nimbus-zh-cn.az1n.com/" },
    { "label": "GitHub", "link": "https://github.com/Azincc/nimbus-docs-template.git" }
  ],
  "theme": {
    "defaultMode": "system"
  },
  "brand": {
    "logo": "./assets/nimbus-mark.svg",
    "logoAlt": "Nimbus",
    "favicon": "./assets/nimbus-mark.svg"
  }
}
```

`schemaVersion` must be `1`; other fields are optional. Unknown fields, invalid JSON, and invalid values fail the build, including in an automatically discovered file. An explicitly empty `DOCS_CONFIG_PATH` still disables JSON for compatibility, but a repository without `site.json` needs no variable or empty value.

## Configuration fields

| Field | Format | Purpose |
| --- | --- | --- |
| `schemaVersion` | Required; `1` | Configuration format version |
| `title` | String | Site name |
| `description` | String | Site introduction and default description |
| `locale` | Language tag, such as `en` or `zh-CN` | Page language metadata |
| `homeLabel` | String | Home-page label in navigation |
| `github` | Full HTTPS URL or `null` | Repository link; use `null` to hide it |
| `navigation` | Array of objects with `label` and `link` | Top navigation |
| `theme` | Object | Default appearance and accent color |
| `brand` | Object | Logo, favicon, and default social image |

`locale` identifies the page language; it does not translate content or UI labels and does not create multilingual routes. English documents live in `docs/`. To publish the separate [Chinese documents](https://github.com/Azincc/nimbus-docs-template/tree/main/docs-zh-CN), set `DOCS_PATH=docs-zh-CN`, then rebuild. The configuration follows automatically. If an older deployment explicitly sets `DOCS_CONFIG_PATH`, delete it or update it to `docs-zh-CN/site.json` first.

## Navigation and sidebar

`navigation` configures the top links. Use generated routes such as `/` or `/getting-started` for internal links, rather than `.md` file paths. Use full HTTPS URLs for external links. Internal target pages must exist or the build reports an error.

The sidebar is generated from documents and configured separately from top navigation. Maintain page titles, descriptions, and order in Markdown frontmatter. See [Writing documentation](./writing-docs.md#titles-and-sidebar).

To reposition pages and categories, set `sidebar.order` as described in [Sidebar order](./sidebar-order.md), then rebuild.

## Theme

`theme.defaultMode` supports `system`, `light`, and `dark`. This example uses `system` to follow the browser's appearance preference by default.

The optional `theme.accent` accepts a six-digit hexadecimal color:

```json
{
  "theme": {
    "defaultMode": "system",
    "accent": "#2563eb"
  }
}
```

Merge this field example into the complete site JSON.

## Branding

### Set the logo and favicon with build variables

These optional variables do not appear in the initial deployment form. To customize branding later, open **Worker → Settings → Builds → Build variables and secrets**, add ordinary variables, save, and rebuild:

| Build variable | When unset | JSON field overridden | Accepted value |
| --- | --- | --- | --- |
| `SITE_LOGO` | JSON logo, then built-in Nimbus logo | `brand.logo` | An HTTP(S) image URL or a file path relative to the document repository root |
| `SITE_FAVICON` | JSON favicon, then built-in Nimbus logo | `brand.favicon` | An HTTP(S) image URL or a file path relative to the document repository root |

Both variables are unset by default. They use the corresponding `brand.logo` or `brand.favicon` from site JSON; if that field is absent, they use the built-in official Nimbus logo at `/nimbus-logo.svg`. An explicit HTTP(S) image URL or repository path overrides JSON. The two variables work independently.

To restore this fallback, delete the corresponding build variable. Existing `default`, empty, and whitespace-only values keep the same behavior for compatibility, even if Wrangler has a custom image default. Deleting a build variable restores a custom Wrangler default if one remains in an older or customized copy.

For an older deployment, [update the template](./deployment/template-update.md) to get these defaults. Saved build variables continue to override them; delete old optional values to use the new automatic behavior.

For example, set both values to `docs/assets/nimbus-mark.svg` to use that file in `DOCS_REPO`. You can also use image URLs such as `https://example.com/brand/logo.svg` or `http://example.com/brand/favicon.png`. Local variable paths always start at the **document repository root**, independently of `DOCS_PATH` and `DOCS_CONFIG_PATH`, and work even without a site JSON file.

These are build variables. Runtime variables under ordinary **Settings → Variables & Secrets** do not automatically reach static builds. Rebuild after changing variables to update the pages.

### Maintain branding in JSON

| Field | Purpose |
| --- | --- |
| `brand.logo` | Site logo |
| `brand.logoAlt` | Alternative text for the logo |
| `brand.favicon` | Browser icon |
| `brand.socialImage` | Default social sharing image |

Images in JSON can use full HTTPS URLs or local paths relative to the site JSON file. In this example, `./assets/nimbus-mark.svg` is resolved from `docs/site.json` to `docs/assets/nimbus-mark.svg`. The [home page](./README.md) uses the same image. This differs from `SITE_LOGO` and `SITE_FAVICON`, whose paths start at the repository root.

Local assets must exist and their resolved paths must stay inside the source repository. The template copies only referenced assets into the public output. Markdown images use paths relative to the Markdown file that references them. See [Images and assets](./writing-docs.md#images-and-assets).

## Site URL

`SITE_URL` is an optional build variable, not a site JSON field, and is unset by default. It does not appear in the initial deployment form. Without it, the site remains accessible locally or at its Cloudflare address, but omits canonical URLs, SEO metadata requiring an absolute site origin, and the sitemap. Existing explicit empty values retain this behavior.

When deploying your own site or changing its domain, enter the actual public URL including `https://` as a build variable and rebuild. `SITE_URL` does not bind a custom domain; configure that domain in Cloudflare first. Changing this variable later does not require changing the build command, deploy command, or root directory selected during setup.

## Updates and credentials

After changing `docs/site.json` or branding assets, commit and push to the configured document source branch, then trigger a build. If you only change `SITE_LOGO` or `SITE_FAVICON` in Cloudflare, save and rebuild. The footer and `/_build.json` record the document commit SHA; it may stay the same when only build variables change.

The public [nimbus-docs-template example repository](https://github.com/Azincc/nimbus-docs-template.git) needs no token. For private repositories, provide `DOCS_TOKEN` only as a Cloudflare Build Secret for Git fetch. Never put it in site JSON, image URLs, or other public fields.
