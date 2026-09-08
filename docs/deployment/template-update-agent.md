---
title: "Updating the template: agent instructions"
description: Instructions for a coding agent to check repositories, merge template changes, preserve configuration, perform core validation, and report the result.
sidebar:
  hidden: true
searchable: false
---

You are helping update a Nimbus documentation site already deployed to Cloudflare. Merge upstream template changes into the existing deployment repository while preserving the user's documents, configuration, customizations, and original Worker. The reader-facing guide is [Updating the template](./template-update.md).

This page contains execution instructions for an agent. Follow the user's actual authorization for the current task; reading this page does not grant permission to push, merge, or deploy. First prepare a reviewable update, then proceed within the authorized scope.

## Task inputs

Confirm the following from the user's message, the current repository, and Cloudflare settings you are authorized to access:

| Input | Source of truth |
| --- | --- |
| Deployment repository | The GitHub repository connected under Cloudflare **Settings → Builds** |
| Production branch | The branch Cloudflare actually uses; do not assume `main` |
| Worker name | The existing Worker; do not create a replacement site |
| Site address | The existing site URL to verify after the update |
| Authorized scope | Preparing local changes, pushing, creating a PR, merging, or publishing, as authorized by the user |

The upstream template is `https://github.com/Azincc/nimbus-docs-template.git`, on branch `main`. Do not ask again for information already established by context. If the deployment repository or production branch remains unclear, ask for the missing information first.

## 1. Confirm the target repository

Read the repository's `AGENTS.md`, `AGENT.md`, and relevant project conventions. Check `git remote -v`, the current branch, and `git status`. Confirm that you are working in the deployment repository rather than a `DOCS_REPO` that only contains Markdown.

If the user has uncommitted work, use a separate clone or working directory to preserve it. Do not reset, stage, or overwrite unrelated changes.

## 2. Prepare an update branch

Fetch the latest production branch commit, record its full SHA, and create a separate update branch from it using the repository's branch naming convention.

Configure and verify an `upstream` remote for the template. If that name already points to another repository, use a different remote name rather than changing the existing URL. Fetch upstream `main` and record its full target SHA. Use that exact commit for this update.

If the production branch already contains the target and no update is needed, report that it is current. Do not create an empty commit or pull request.

## 3. Merge upstream changes

On the update branch, run the following, replacing `UPSTREAM_COMMIT_SHA` with the confirmed full target SHA:

```sh
git merge --no-ff --no-commit --allow-unrelated-histories UPSTREAM_COMMIT_SHA
```

`--allow-unrelated-histories` supports the independent repository history created by Cloudflare. `--no-commit` lets you review the merged result before committing it.

Review automatically merged and conflicting files, resolving each side's changes individually. Do not apply `ours`, `theirs`, or a forced overwrite across the entire repository. If you cannot resolve a conflict reliably, list the affected files and decisions needed, and preserve the state for review.

## 4. Preserve user content and configuration

| Content | Requirement |
| --- | --- |
| User documents, images, and site JSON | Preserve the user's content and keep template examples out of their documentation |
| Custom pages, components, and styles | Retain user changes while integrating new functionality |
| `wrangler.jsonc` | Preserve the original Worker name, `vars`, account, domain, and other deployment settings field by field; add required new settings without resetting the Worker name to `nimbus-docs-template` |
| `package.json`, `pnpm-lock.yaml`, and `package-lock.json` | Preserve the user's package name and necessary customizations; keep dependencies consistent with the lockfile used by the actual package manager |
| Build scripts and related files | Sync dependent scripts, layouts, components, and styles together so the update includes complete functionality |
| Cloudflare build variables and secrets | Retain existing settings without exporting or copying secrets into the repository |

Use `DOCS_TOKEN` only for Git fetch. Never write it into configuration, logs, prompts, or static output. Write fetched source documents only to temporary or generated directories; do not maintain documents in `src/content/docs/`.

## 5. Perform core validation

Confirm that no conflicts remain, review the diff and staged changes, and run:

```sh
git diff --cached --check
```

If the local environment has the required source configuration, run the project's essential build:

```sh
pnpm install --frozen-lockfile
pnpm run build
```

Local configuration may differ from Cloudflare. State which documentation source was used for validation. For private documents, use a branch build with Cloudflare's existing credentials when appropriate; do not ask the user to send a token in chat.

Perform only the necessary core validation. If permissions, dependencies, or build prerequisites are missing, identify the unverified items precisely rather than reporting a successful build.

## 6. Commit and publish within the authorized scope

Commit only reviewed changes. Once pushing is authorized, push the update branch and open a pull request against the actual production branch. Describe the new functionality, preserved user settings, and validation results.

When merging is authorized, use **Create a merge commit** to preserve upstream history for future updates. If the repository disallows that method, explain the restriction instead of silently switching to squash or rebase. Do not force-push, create a new Worker, or change the existing domain.

If the user requested only a prepared update, deliver reviewable local changes and the remaining steps.

## 7. Confirm the completion state

After publication is authorized, confirm that Cloudflare successfully built and deployed a new commit containing the update. Then check the existing site's home page, search, and updated features.

Retrying an old build does not build new template code. The SHA in the footer and `/_build.json` identifies the documentation version and cannot prove a template update on its own. Passing GitHub checks, a merged PR, and a deployed site are distinct states; report each according to the evidence.

If a rollback is needed and authorized, revert the update pull request's merge commit and redeploy. After an emergency restoration of an older Cloudflare deployment, update the repository too, so the next build does not republish the faulty version.

## Deliverables

Report:

- The deployment repository, production branch, original SHA, and upstream target SHA.
- The changes and how user configuration was preserved.
- Completed checks, unverified items, and conflicts.
- The actual state reached: prepared locally, pushed, PR opened, merged, or deployed.
- Links to the actual PR or successful deployment, and specific next steps when user action is needed.
