---
title: Private repositories
description: Configure read-only access to a private GitHub documentation source for Cloudflare builds, publication, and automatic updates.
sidebar:
  label: Private repositories
  order: 20
---

A private documentation source does not make the generated site private. If you need to restrict readers, configure access controls such as Cloudflare Access separately; this template does not configure them automatically.

This guide creates a Worker from the public template and uses your private GitHub repository as its documentation source. GitHub authorization for the deployment template, the token used to read documents, and reader access to the site are separate concerns.

## 1. Create a Worker from the public template

Open the [nimbus-docs-template README](https://github.com/Azincc/nimbus-docs-template/blob/main/README.md), select **Deploy to Cloudflare**, complete Cloudflare and GitHub authorization, and create your template copy and Worker.

Confirm these build settings during deployment, and keep them unchanged when connecting your private documentation source:

| Build setting | Value |
| --- | --- |
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` |
| Root directory | Repository root |

The initial template form has three source fields: `DOCS_REPO`, `DOCS_BRANCH`, and `DOCS_PATH`. Keep their prefilled public example values for this first deployment, then add the private source variables and secret below. If you already entered a private repository and the first fetch failed, add the missing configuration after the Worker is created and retry.

The Cloudflare GitHub App authorization connects and builds the template repository. It does not provide private repository credentials to the documentation fetch script. That script uses a GitHub Personal Access Token (PAT), supplied through `DOCS_TOKEN`, to perform Git fetch.

## 2. Prepare documents in the private repository

On the documentation branch of your private repository, create `docs/README.md`, add a title and body, and commit it. This file becomes the home page. See [Writing documents](../writing-docs.md) for more pages and images.

To customize the site name, navigation, or branding, add `docs/site.json`. The smallest configuration is:

```json
{
  "schemaVersion": 1
}
```

Add other fields as needed; see [Site configuration](../site-config.md). The template automatically reads `site.json` in `DOCS_PATH`. If the file does not exist, it uses generic site settings; no `DOCS_CONFIG_PATH` variable or empty value is needed.

Note the private repository's HTTPS clone URL, documentation branch, and paths to the documentation directory and configuration file relative to the repository root. Copy the URL from **Code → HTTPS** in the repository, without adding a token.

## 3. Create a read-only GitHub token

Use a GitHub account that can read the target private repository:

1. Open your personal **Settings → Developer settings → Personal access tokens → Fine-grained tokens** and select **Generate new token**.
2. Enter a recognizable name and expiration date. Builds will lose access when the token expires, so you will need to replace it. Your organization may limit token lifetimes.
3. Under **Resource owner**, select the personal account or organization that owns the private repository.
4. Under **Repository access**, select **Only select repositories** and choose only the target private documentation repository.
5. Under **Repository permissions**, set **Contents** to **Read-only**. GitHub automatically includes the required **Metadata: Read-only** permission. Write access is unnecessary.
6. Generate the token. If your organization requires approval, wait for an administrator to approve it before using it in builds. A pending token cannot read the organization's private content.

Save the token in the Cloudflare build secret in the next step. Do not put it in documents, repository configuration, Git URLs, or chat messages. If the organization or repository is unavailable in the selector, check your account permissions and whether the organization permits fine-grained PATs.

## 4. Configure build variables and the secret

Open the Worker's **Settings → Builds → Build variables and secrets**. Use ordinary variables for source and site settings, and select **Secret** for `DOCS_TOKEN`. The four optional site variables are absent from the initial deployment form; add them here only when needed.

| Name | Type | Value |
| --- | --- | --- |
| `DOCS_REPO` | Variable | The target private GitHub repository's HTTPS clone URL, without a username, password, or token |
| `DOCS_BRANCH` | Variable | The branch containing private documents; omit it to inherit `main` if appropriate |
| `DOCS_PATH` | Variable | The documentation directory relative to the private repository root; the structure above uses the default, `docs` |
| `DOCS_CONFIG_PATH` | Variable, optional | Add only when the configuration file is elsewhere in the source repository; otherwise `DOCS_PATH/site.json` is read if present |
| `SITE_URL` | Variable, optional | Your actual site address including `https://`, once known; unset by default |
| `SITE_LOGO` | Variable, optional | An HTTP(S) image URL or a path relative to the private source repository root, such as `docs/assets/nimbus-mark.svg`; otherwise use JSON branding or the built-in Nimbus logo |
| `SITE_FAVICON` | Variable, optional | An HTTP(S) image URL or a path relative to the private source repository root, such as `docs/assets/nimbus-mark.svg`; otherwise use JSON branding or the built-in Nimbus logo |
| `DOCS_TOKEN` | Secret | The read-only GitHub token created above, with any required organization approval completed |

Source variables use the public defaults in `wrangler.jsonc` unless overridden; you do not need to repeat defaults that still apply. You must override `DOCS_REPO` with your private repository URL, or the build will continue to read the public example. Optional site variables use the automatic behavior described above.

An explicitly configured `DOCS_CONFIG_PATH` must point to an existing, valid JSON file. For an older deployment, [update the template](./template-update.md) first, then delete an old `DOCS_CONFIG_PATH` to enable automatic discovery. Existing optional build variables continue to override the new defaults until removed.

Unset `SITE_LOGO` and `SITE_FAVICON` inherit JSON `brand.logo` and `brand.favicon`, respectively, or use the built-in official Nimbus logo (`/nimbus-logo.svg`) if the corresponding field is absent. Existing `default` and empty values have the same behavior; explicit HTTP(S) image URLs and repository paths override JSON. Variable paths are relative to the `DOCS_REPO` repository root, regardless of whether the site JSON exists or where it is stored. Existing local asset paths inside the JSON remain relative to that JSON file. The same read-only token lets the build read repository images; no separate image credential is needed.

`SITE_URL` does not connect a domain automatically. Complete any custom domain configuration before using that address. Without this variable, the site remains browsable but omits canonical links, SEO output, and sitemaps that depend on the public site origin.

**Build variables and secrets** are provided to the build process. Worker runtime variables and secrets under **Settings → Variables & Secrets** are not automatically available to static builds. Setting `DOCS_TOKEN` only in the runtime section does not authenticate documentation fetches. Logo and favicon build variables also require a rebuild after saving.

Save, then select **Retry build** in the build record. If the creation flow had no build secret field, this completes the missing configuration and starts the first build from the private source. Future source or token changes use the same variables and secret; keep the build command, deploy command, and root directory unchanged.

## 5. Verify the first publication

After the build and deployment succeed, perform these core checks:

- Compare the documentation commit SHA in the build log with the selected branch of the private repository. This is the source documentation version, which may differ from the template repository commit shown by Cloudflare.
- Open the Worker's site address and confirm that the home page displays your private source content, and that document links and images work.
- Check the commit SHA in the footer or `/_build.json` to confirm the published pages use the documentation version fetched by this build.

If the default example still appears, confirm that **Build variables → DOCS_REPO** was saved for the correct Worker, then trigger another build.

## 6. Trigger updates when documents change

See [Deploy hooks](./deploy-hook.md) for every form field, push verification, and troubleshooting. Public and private repositories use the same trigger process; private documents are still read using the `DOCS_TOKEN` build secret.

When the private source and the template repository connected to Builds are separate, connect source repository pushes to a Cloudflare Deploy Hook. The first build does not require a webhook, so configure it after successful publication:

1. In **Settings → Builds → Deploy Hooks**, create a hook, select the template build branch, and copy the generated URL.
2. In the private documentation repository, open **Settings → Webhooks → Add webhook**, enter the values below, and save. Managing webhooks requires the relevant repository administration permission, separate from the read-only documentation token.

| Webhook field | Value |
| --- | --- |
| Payload URL | The URL generated by the Cloudflare Deploy Hook |
| Content type | `application/json` |
| Secret | Leave empty; do not enter `DOCS_TOKEN` here |
| Events | `Just the push event` |

The Deploy Hook URL is itself a trigger credential. Store it in webhook settings, not in the repository. `DOCS_TOKEN` only reads documents during builds and is not a webhook secret for this process.

Push a document change to the branch specified by `DOCS_BRANCH`. Check the request under GitHub **Recent Deliveries**, then check the new Cloudflare build and site content. The hook selects a template branch; `DOCS_BRANCH` selects the documentation branch read by the build. They may differ.

If the template and documents already share the same Builds-connected repository and branch, repository pushes already trigger builds. An additional webhook connection is unnecessary.

## 7. Rotate or replace the token

If the token expires, is revoked, or needs rotation, create a new read-only token as described in step 3. After any organization approval, update **Build variables and secrets → DOCS_TOKEN**, save, and rebuild. Revoke the old token after confirming that the replacement works.

When changing private repositories, also update `DOCS_REPO` and ensure that the new token's **Resource owner** and repository selection cover the new source. Do not write the token into the template repository or change the webhook Secret field.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Fetching the private repository fails with a not-found or permission error | Verify the HTTPS URL, branch, and `DOCS_TOKEN` build secret on this Worker; confirm the token has not expired, selects the repository, grants read-only Contents access, and has organization approval |
| A `DOCS_CONFIG_PATH` or JSON error appears | Correct an explicitly configured path or delete the variable to use automatic discovery; if a file exists, check JSON syntax and `schemaVersion: 1` |
| A page or image is missing during the build | Confirm the file is committed to `DOCS_BRANCH`, and check `DOCS_PATH`, capitalization, and relative links; see [Writing documents](../writing-docs.md) |
| Changing variables or the secret did not update the site | Save and trigger a new build; check its documentation SHA rather than only an older deployment |
| A GitHub push did not start a build | Check the latest webhook delivery, Deploy Hook URL, and selected template branch; confirm the document change was pushed to the source branch the build reads |

## Official references

- [Cloudflare Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Managing GitHub personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

Return to [Getting started](../getting-started.md) or the [home page](../README.md).
