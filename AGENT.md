# Maintaining this Nimbus template

This project wraps the Nimbus Astro starter with a GitHub Markdown source pipeline. Follow `AGENTS.md` for project rules. Keep verification focused on the changed behavior and core build flow.

## Content and generated files

- `docs/` is the default English document source, with site settings in `docs/site.json`.
- `docs-zh-CN/` preserves the Chinese edition, with its own `site.json`. Keep corresponding guides in sync when behavior changes.
- `README.md` is the primary English repository guide; `README.zh-CN.md` is its Chinese counterpart.
- Users select a source repository, branch, and directory through `DOCS_REPO`, `DOCS_BRANCH`, and `DOCS_PATH`.
- `src/content/docs/` contains generated content. Do not create or maintain source documents there.
- `.cache/`, `.generated/`, `.astro/`, `.nimbus/`, `public/_source/`, `public/_build.json`, and `dist/` are disposable build outputs.
- Builds fetch the remote source. Local edits to either document set become part of a normal build only after they reach the configured source branch.
- Do not modify the fetched source repository. Write conversions only to temporary or generated directories.
- `DOCS_TOKEN` is a build secret used only for Git fetch. Never persist it in configuration, logs, URLs, or static output.

Source documents use ordinary `.md`, optionally with frontmatter. The pipeline does not execute MDX or JavaScript from the document source. Use the document root's `README.md` or `index.md` for the home page; do not include both. If neither exists, the build generates an index.

```md
---
title: My page
description: One-line summary.
---

## Section heading

Content here. The page H1 comes from the title.
```

See `docs/writing-docs.md`, `docs/sidebar-order.md`, and `docs/site-config.md` for source authoring and configuration.

## File layout

| Path | Role |
| --- | --- |
| `astro.config.ts` | Nimbus integration and generated site settings |
| `wrangler.jsonc` | Worker configuration and public build defaults |
| `scripts/source.mjs` | Validate source settings and fetch a branch |
| `scripts/content.mjs` | Convert Markdown routes, links, and assets |
| `scripts/site-config.mjs` | Validate and map source site configuration |
| `scripts/build.mjs` | Prepare content, build Astro, and index search |
| `scripts/deploy.mjs` | Verify and deploy completed build artifacts |
| `src/components.ts` | Nimbus internal MDX component registry |
| `src/components/`, `src/layouts/`, `src/styles/` | Site presentation |
| `src/pages/` | Document routes, Markdown alternates, AI metadata, and OG images |
| `tests/` | Core behavior tests |

## Local commands

Use Git, Node.js 22.12.0 or later, and pnpm 10.2.0. Install with `pnpm install --frozen-lockfile`, or `npm ci` when using npm.

| Goal | Command |
| --- | --- |
| Develop the site with remote source docs | `pnpm dev` |
| Build pages and search | `pnpm build` |
| Preview built assets on Workers locally | `pnpm preview:cf` |
| Test core behavior | `pnpm test` |
| Check Astro and TypeScript after a build | `pnpm check` (`pnpm typecheck` is an alias) |
| Serve a completed build for browser tests | `pnpm e2e:dev --port 8787` |
| Inspect source settings | `pnpm config:probe` |
| Deploy a successful build | `pnpm deploy` |

Deployment needs Cloudflare authorization and is a separate action from a local build. A build records the actual document SHA in the footer and `/_build.json`; it does not currently identify the template commit.

## Nimbus UI maintenance

The copied UI files under `src/` belong to this template. Updating the Nimbus package does not automatically update these files. Review upstream changes before applying them, preserving the Markdown source pipeline and generated configuration.

| Goal | Action |
| --- | --- |
| Add a source page | Add `.md` in the configured source directory; use `docs/` for this repository's example |
| Add a custom route | Add a file under `src/pages/` |
| Change OG styling | Edit `src/pages/og/_og-card-config.ts` |
| List Nimbus UI items | `pnpm exec nimbus-docs list` |
| Add a Nimbus UI item | `pnpm exec nimbus-docs add <slug>`, then review the changes |
| Check copied starter files | `pnpm exec nimbus-docs outdated` |
| Review a starter update | `pnpm exec nimbus-docs diff <file>` |

Register any internal PascalCase MDX components in `src/components.ts`. Internal partials use `<Render file="..." />`; do not import `.mdx` directly. These facilities belong to the site's implementation and do not enable MDX in fetched source documents.

Preserve `<AgentDirective />` in `BaseLayout.astro`, Markdown alternate links, document routes, and the `data-pagefind-body` search container. Use `astro-icon` and the existing Phosphor icon set for UI icons. Inspect generated search and routes when changing their implementation.

Nimbus CLI checks can supplement targeted verification, but inspect findings before changing source code: generated files may require preparation, and platform-specific CLI issues are not automatically project defects.

Upstream project: [nimbus-docs.com](https://nimbus-docs.com).
