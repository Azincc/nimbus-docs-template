---
title: Build configuration
description: Set the documentation source, site URL, and branding in the Cloudflare dashboard, then rebuild.
sidebar:
  label: Build configuration
  order: 10
---

You can set the documentation repository, branch, directory, site URL, and images in the Cloudflare dashboard. Routine changes to these settings do not require development tools or edits to code or JSON files.

The process is: **open build settings → add or edit variables → save → rebuild**.

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

After entering each setting, select **Add** to continue. Adding all five settings the first time makes them easier to manage together, but you can omit any setting whose default already suits your site.

| What to change | Name | Value |
| --- | --- | --- |
| GitHub repository containing your documents | `DOCS_REPO` | The HTTPS clone URL, such as `https://github.com/example-user/project-docs.git`; replace the example with your repository |
| Source branch | `DOCS_BRANCH` | The branch containing your documents, such as `main` |
| Documentation directory | `DOCS_PATH` | A path such as `docs`; enter `.` if the documents are at the repository root |
| Site configuration file | `DOCS_CONFIG_PATH` | `docs/site.json` or the actual path if the file exists; if there is no configuration file, keep this variable and leave its value empty |
| Public site address | `SITE_URL` | Your actual address, such as `https://your-worker.your-subdomain.workers.dev`, or a custom domain you have already connected; include `https://` and no page path |

`example-user/project-docs` illustrates the URL format; replace it with your repository. In GitHub, open the documentation repository and select **Code → HTTPS** to copy its clone URL. The branch selector appears above the file list. The default source is `https://github.com/Azincc/nimbus-docs-template.git`; creating a template copy does not automatically change it to your repository.

Directory and configuration paths are relative to the documentation repository root. For example, if documents are in `manual` and the configuration file is in `config/site.json`, enter those two values. Do not prepend the repository URL.

**An empty Cloudflare field contains no characters. Do not enter two quotes (`""`).** If your documentation repository has no site configuration file, add `DOCS_CONFIG_PATH` and leave its value empty. Omitting the variable would continue to use the default `docs/site.json` path.

`SITE_URL` defaults to the example site, `https://nimbus.az1n.com`. Change it to your own site's actual address. If you do not know the address yet, you can leave the value empty: the site remains browsable, but it will not generate search-engine links or a sitemap that depend on a public origin. Entering a custom domain does not connect it automatically; configure it in the Worker's domain settings first.

## 3. Set the logo and favicon

The current template supports these additional variables. Both are optional; when unset, the site uses the images from its site configuration.

| What to change | Name | Value |
| --- | --- | --- |
| Site logo | `SITE_LOGO` | A direct HTTP(S) image URL, or an image path in the documentation repository, such as `docs/assets/logo.svg` |
| Browser tab icon | `SITE_FAVICON` | An HTTP(S) image URL, or an image path in the documentation repository, such as `docs/assets/favicon.png` |

Use the address of the image itself. A GitHub file preview page is not an image URL. For an image stored in the documentation repository, enter its path relative to the repository root.

These variables work independently: changing the logo does not change the favicon. Keeping a variable with an empty value restores the corresponding image from the site configuration.

Older deployment copies may not support these variables yet. If a rebuild does not apply the change, ask the template maintainer to sync the updated build scripts first. Adding a variable does not upgrade the deployment copy.

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

If the build fails, read the error in the log, correct the relevant input, and retry. For example, a missing configuration file usually means `DOCS_CONFIG_PATH` points to a file that does not exist. Leave its value empty if you have no configuration file.

## Change settings or restore defaults later

Return to **Settings → Builds → Build variables and secrets**, edit the relevant value, save, and rebuild.

Values saved here take precedence over defaults in the template files. Your saved build variables continue to take precedence even if a later template update changes a default.

To restore a template default, delete the corresponding build variable, save, and rebuild. Deleting a variable and keeping it with an empty value have different effects:

| Action | Result |
| --- | --- |
| Delete a variable | Read the template default again |
| Leave `DOCS_CONFIG_PATH` empty | Use the generic site configuration without reading a site JSON file |
| Leave `SITE_URL` empty | Do not specify a public site origin |
| Leave `SITE_LOGO` or `SITE_FAVICON` empty | Use the corresponding image from the site configuration |

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Cannot find the Add button | Scroll to the variables section under **Builds**, below the runtime variables section |
| The page still says changes are unsaved | Wait for the save request and check for errors; if there are none, refresh and verify that the values remain, because the message may be stale |
| The site still shows the template's example documents | Set `DOCS_REPO` to your documentation repository, save, and rebuild |
| The site configuration file cannot be found | Check the path if the file exists; otherwise, keep `DOCS_CONFIG_PATH` and leave its value empty |
| A private repository cannot be fetched | Confirm that `DOCS_TOKEN` is a build **Secret** and grants read access to the target repository |
| The logo or favicon has not changed | Check the image address, saved values, and build result; for older copies, confirm the build scripts support branding variables |
| Documentation changes do not update the site | Set up a [deploy hook](./deploy-hook.md) for a separate documentation repository so pushes trigger builds |

The site name, navigation, theme, and sidebar order have their own settings. See [Site configuration](../site-config.md) and [Sidebar order](../sidebar-order.md). The build variables described here cover only the listed settings; they do not turn every site setting into a dashboard field.

## Notes for template maintainers

Public defaults are stored in `vars` in the deployment template repository's root `wrangler.jsonc`. The build scripts first read variables with the same names from the build environment, then fall back to these defaults. `DOCS_TOKEN` is read only from the build environment.

Repository defaults do not appear automatically in the Cloudflare build variables list. Add them once in build settings if you want to initialize that list for a user. After the source, branch, directory, and site URL have been added, the user can make routine adjustments entirely in Cloudflare.

Maintainers can also edit and commit repository defaults, but saved build variables with the same names take precedence. Build a new template commit containing the changes; retrying an older commit cannot read changes that it does not contain.

Official reference: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
