---
title: Build configuration
description: Set the documentation source, site URL, and branding in the Cloudflare dashboard, then rebuild.
sidebar:
  label: Build configuration
  order: 10
---

You can set the documentation repository, branch, directory, site URL, and images in the Cloudflare dashboard. Routine changes to these settings do not require development tools or edits to code or JSON files.

The process is: **open build settings → add or edit variables → save → rebuild**.

For a new deployment, the template's Cloudflare form shows only `DOCS_REPO`, `DOCS_BRANCH`, and `DOCS_PATH`, with prefilled example values. The four optional settings below are absent from that form. You can deploy without a site JSON file, public site URL, or custom images, then add settings here when needed.

## 1. Find build variables

1. Sign in to Cloudflare and open **Workers & Pages**.
2. Select your deployed Worker.
3. Open **Settings** and scroll to **Builds**.
4. Find **Build variables and secrets** in the build settings and select **Add**.

Use the variables section under **Builds**. The runtime **Variables and Secrets** section higher on the page serves a different purpose. Because this template serves static assets, that section may say that variables cannot be added to an assets-only Worker. This does not prevent you from setting build variables.

If the page says no build variables or secrets are configured, select **Add**. The site is currently using the template defaults; this message does not mean deployment failed. Once you add settings here, you can edit them directly in the list.

## 2. Set the basic variables

Selecting **Add** opens three fields: **Type**, **Name**, and **Value**.

- **Type**: choose **Variable** for the public settings below.
- **Name**: copy the name from the table exactly, including capitalization.
- **Value**: enter your value without quotes. Enter the name and value separately; do not put an entire assignment such as `DOCS_BRANCH=main` into one field.

After entering each setting, select **Add** to continue. Add only the source values you want to change; defaults remain in effect for values you have not overridden.

| What to change | Name | Value |
| --- | --- | --- |
| GitHub repository containing your documents | `DOCS_REPO` | The HTTPS clone URL, such as `https://github.com/example-user/project-docs.git`; replace the example with your repository |
| Source branch | `DOCS_BRANCH` | The branch containing your documents, such as `main` |
| Documentation directory | `DOCS_PATH` | A path such as `docs`; enter `.` if the documents are at the repository root |

`example-user/project-docs` illustrates the URL format; replace it with your repository. In GitHub, open the documentation repository and select **Code → HTTPS** to copy its clone URL. The branch selector appears above the file list. The default source is `https://github.com/Azincc/nimbus-docs-template.git`; creating a template copy does not automatically change it to your repository.

The document directory is relative to the documentation repository root. Do not prepend the repository URL. With `DOCS_PATH=manual`, the template automatically reads `manual/site.json` if it exists; otherwise it uses generic site settings. You do not need to add an empty variable when there is no JSON file.

To publish this repository's Chinese example, set `DOCS_PATH=docs-zh-CN`; the template automatically reads `docs-zh-CN/site.json`. Delete or update any existing explicit `DOCS_CONFIG_PATH` first, then rebuild.

Add these optional settings only when needed:

| What to change | Name | Value |
| --- | --- | --- |
| A configuration file outside the document directory | `DOCS_CONFIG_PATH` | Its actual path relative to the source repository root, such as `config/site.json`; an explicitly selected file must exist and contain valid JSON |
| Public site address | `SITE_URL` | Your actual address, such as `https://your-worker.your-subdomain.workers.dev`, or a custom domain you have already connected; include `https://` and no page path |

`SITE_URL` is unset by default. Until you know the address, do not add it: the website remains browsable, but omits origin-dependent canonical URLs, SEO metadata, and the sitemap. Once the address is known, add it and rebuild. Entering a custom domain does not connect it automatically; configure it in the Worker's domain settings first.

## 3. Set the logo and favicon

Both variables are optional and unset by default: the build uses the corresponding site JSON image, or the built-in official Nimbus logo (`/nimbus-logo.svg`) if that field is absent. Add them only to customize images.

| What to change | Name | Value |
| --- | --- | --- |
| Site logo | `SITE_LOGO` | A direct HTTP(S) image URL, or an image path in the documentation repository, such as `docs/assets/logo.svg` |
| Browser tab icon | `SITE_FAVICON` | An HTTP(S) image URL, or an image path in the documentation repository, such as `docs/assets/favicon.png` |

Use the address of the image itself. A GitHub file preview page is not an image URL. For an image stored in the documentation repository, enter its path relative to the repository root.

Explicit image URLs and repository paths override JSON. The variables work independently: changing the logo does not change the favicon. Delete a variable to restore the fallback. Existing `default`, empty, and whitespace-only values retain the same fallback for compatibility.

For an older deployment, [update the template](./template-update.md) to get these defaults. Changing build variables alone does not update the template.

## 4. Add a secret for a private repository

Public repositories do not require a secret. For a private documentation repository, add:

| Type | Name | Value |
| --- | --- | --- |
| **Secret** | `DOCS_TOKEN` | A GitHub token scoped to the target repository with read-only Contents permission |

See [Private repositories](./private-repository.md) for token creation steps. Paste the token directly into the Cloudflare secret field. Do not put it in the repository URL, a regular variable, documentation, or a code file.

## 5. Save and rebuild

1. Check the names and values, then select **Save** at the bottom of the page.
2. Wait for the save request to finish. If an unsaved-changes message remains, check for errors. If there are no errors, refresh the settings page and confirm the variables and values are still present; this confirms they were saved.
3. Open **Deployments**, open the build record, and select **Retry build**.
4. Wait for the build and deployment to succeed, then open the site to check the result.

Saving variables does not change pages that have already been published; a rebuild is required. Changing these settings does not require another template copy, another click on the deployment button, or changes to the build command, deploy command, or root directory.

If the build fails, read the error in the log, correct the relevant input, and retry. A missing explicitly selected configuration file means `DOCS_CONFIG_PATH` points to a file that does not exist. Correct that path, or delete the variable to restore automatic discovery. Invalid JSON still needs to be fixed, even in an automatically discovered file.

## Change settings or restore defaults later

Return to **Settings → Builds → Build variables and secrets**, edit the relevant value, save, and rebuild.

Values saved here take precedence over defaults in the template files. Your saved build variables continue to take precedence even if a later template update changes a default. After updating an older template, delete an old `DOCS_CONFIG_PATH` to let it follow `DOCS_PATH` automatically. Remove other optional values, such as the old example `SITE_URL`, if you want their new unset behavior.

To restore a template default, delete the corresponding build variable, save, and rebuild. You can also choose the behavior below:

| Action | Result |
| --- | --- |
| Delete `DOCS_CONFIG_PATH` | Automatically read `DOCS_PATH/site.json` if present; otherwise use generic site settings |
| Delete `SITE_URL` | Do not specify a public site origin |
| Delete `SITE_LOGO` or `SITE_FAVICON` | Use the corresponding site JSON image, then the built-in Nimbus logo if absent |
| Delete a document-source variable | Read that source value's template default again |

For compatibility, an explicitly empty `DOCS_CONFIG_PATH` still disables JSON, an empty `SITE_URL` still leaves the public origin unspecified, and `default` or empty image values still inherit JSON or the built-in image. You do not need to create empty fields in Cloudflare to use the new defaults. If your template copy retains custom optional defaults in `wrangler.jsonc`, deleting a build variable restores those values instead.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Cannot find the Add button | Scroll to the variables section under **Builds**, below the runtime variables section |
| The page still says changes are unsaved | Wait for the save request and check for errors; if there are none, refresh and verify that the values remain, because the message may be stale |
| The site still shows the template's example documents | Set `DOCS_REPO` to your documentation repository, save, and rebuild |
| The site configuration file cannot be found | Correct the explicit path, or delete `DOCS_CONFIG_PATH` to restore automatic discovery; if JSON exists but is invalid, fix its contents |
| A private repository cannot be fetched | Confirm that `DOCS_TOKEN` is a build **Secret** and grants read access to the target repository |
| The logo or favicon has not changed | Check the image address, saved values, and build result; update older template copies to get the current fallback behavior |
| Documentation changes do not update the site | Set up a [deploy hook](./deploy-hook.md) for a separate documentation repository so pushes trigger builds |

The site name, navigation, theme, and sidebar order have their own settings. See [Site configuration](../site-config.md) and [Sidebar order](../sidebar-order.md). The build variables described here cover only the listed settings; they do not turn every site setting into a dashboard field.

## Notes for template maintainers

Keep only the three public document-source defaults in `vars` in the template repository's root `wrangler.jsonc`. Cloudflare uses these declarations to create the initial deployment fields. Optional settings are handled by build-script defaults; declaring them in `vars` again would reintroduce fields in the initial form. Build environment variables take precedence, and `DOCS_TOKEN` is read only from the build environment.

The initial deployment form and the deployed Worker's build variables list are separate. If the latter is empty, users can add only the settings they want to change; an empty list does not mean template defaults are missing. Optional configuration needs no placeholder entries.

Maintainers can also edit and commit repository defaults, but saved build variables with the same names take precedence. Build a new template commit containing the changes; retrying an older commit cannot read changes that it does not contain.

Official reference: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
