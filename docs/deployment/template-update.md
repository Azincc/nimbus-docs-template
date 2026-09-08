---
title: Updating the template
description: Update a deployed template, ask an agent for help, and verify that the site has been updated.
audience: human
sidebar:
  label: Updating the template
  order: 40
---

When you create a site from the template, your deployment repository receives a copy of its code. To apply later template updates, sync that code into your repository, then let Cloudflare build and publish it.

Keep using the original deployment repository and Worker to preserve your domain and the build variables and secrets stored in Cloudflare. For agent assistance, share the separate [agent instructions](./template-update-agent.md).

## 1. Find the repository to update

In Cloudflare, open **Workers & Pages → your Worker → Settings → Builds** and check **Git repository** and **Production branch**. The connected repository is the deployment repository whose template code needs updating.

`DOCS_REPO` identifies the source repository containing Markdown, images, and site configuration. It may be the deployment repository or a separate repository. Updating only the documentation source, or retrying a Cloudflare build, does not sync upstream template code.

Open the deployment repository in GitHub and choose the appropriate process:

| Repository type | Update method |
| --- | --- |
| GitHub displays `forked from Azincc/nimbus-docs-template` below the repository name and provides **Sync fork** | Use the GitHub sync steps below |
| An independent copy created through **Deploy to Cloudflare**, without that fork relationship | Ask an agent or maintainer to follow section 3 |

Upstream template: [Azincc/nimbus-docs-template](https://github.com/Azincc/nimbus-docs-template). See the [commit history](https://github.com/Azincc/nimbus-docs-template/commits/main/) for recent changes.

## 2. Sync a fork in GitHub

1. Open your deployment repository and select the production branch used by Cloudflare, usually `main`.
2. Select **Sync fork → Update branch** to bring in upstream changes.
3. If GitHub reports conflicts, ask an agent or maintainer to resolve them using the next section.
4. After syncing, check the Cloudflare build and deployment records for the new commit.

This option works only for a repository that is actually a fork of the upstream template. Independent copies have no built-in “sync template” workflow; use the next method instead.

## 3. Ask an agent to update an independent copy

Prepare:

- The deployment repository URL connected to Cloudflare.
- The actual production branch and Worker name.
- Your existing site address.
- Customizations to preserve, such as documents, images, theme changes, or page edits.

Open the [agent instructions](./template-update-agent.md) and select **View as Markdown**. Give that link and the information above to an agent with repository access. You can also use **Copy page** to copy the complete instructions.

Tell the agent how far to proceed: prepare an update for review, or continue through pushing, merging, and publication. You do not need to enter Git commands yourself; a maintainer can also follow the agent instructions.

When reviewing the result, confirm that:

- Your documents, images, site configuration, and customizations are preserved.
- The original Worker name, domain, and documentation source remain correct.
- Existing Cloudflare build variables and secrets are retained without exporting secrets.
- The requested new features are included.

See [Build configuration](./configuration.md) for setting descriptions and where to change them.

## 4. Verify the site update

1. Find the Cloudflare build for the new deployment repository commit and confirm that build and deployment both succeeded.
2. Open your existing site address and check the home page, sidebar, search, and the features included in the update.
3. Open **Settings → Builds → Build variables and secrets** and confirm that your values remain in place.

New template code must be built from a commit that contains it. Retrying an old commit's build cannot read code merged afterward. If no build starts automatically, check the connected repository, production branch, and automatic build settings, or trigger the current branch through an existing [deploy hook](./deploy-hook.md).

The footer and `/_build.json` display the documentation source commit. This value may stay the same when only template scripts change. Confirm the update using the deployment repository commit in Cloudflare and the actual site behavior.

You can close an update pull request before it is merged. If a merged update needs reverting, ask an agent or maintainer to revert its merge commit and redeploy. In an emergency, restore a previous successful Cloudflare deployment first, then make the corresponding repository change.
