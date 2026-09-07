import assert from 'node:assert/strict';
import { mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildEnvironment, digestDirectory, finalizeArtifacts } from '../scripts/artifacts.mjs';
import { loadSettings } from '../scripts/settings.mjs';
import { UNKNOWN_ORIGIN } from '../scripts/site-config.mjs';

async function temporaryArtifacts(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'nimbus-artifact-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('Astro and deployment environments discard document credentials and preserve Cloudflare authentication', () => {
  const environment = {
    PATH: '/bin', DOCS_TOKEN: 'document-secret', docs_token: 'case-variant-secret',
    NIMBUS_SOURCE_TOKEN: 'helper-secret', NIMBUS_SOURCE_HELPER: '/temporary/helper',
    GIT_ASKPASS: '/custom/askpass', GIT_CONFIG_COUNT: '1', GIT_TRACE_CURL: '1',
    GH_TOKEN: 'github-secret', GITHUB_TOKEN: 'another-github-secret',
    CLOUDFLARE_API_TOKEN: 'deployment-secret', CLOUDFLARE_ACCOUNT_ID: 'account',
    SITE_URL: 'https://docs.example.com',
  };
  assert.deepEqual(buildEnvironment(environment), {
    PATH: '/bin', CLOUDFLARE_API_TOKEN: 'deployment-secret', CLOUDFLARE_ACCOUNT_ID: 'account', SITE_URL: 'https://docs.example.com',
  });
  assert.equal(environment.DOCS_TOKEN, 'document-secret');
});

test('artifact finalization omits placeholder SEO and preserves a configured public origin', async (t) => {
  const directory = await temporaryArtifacts(t);
  const file = path.join(directory, 'index.html');
  await writeFile(file, `<html><head><link href="${UNKNOWN_ORIGIN}/guide/" rel="canonical"><meta content="${UNKNOWN_ORIGIN}/guide/" property="og:url"></head><body><a href="${UNKNOWN_ORIGIN}/guide/">Guide</a></body></html>`);
  await finalizeArtifacts(directory, {});
  const html = await readFile(file, 'utf8');
  assert.ok(!html.includes('canonical') && !html.includes('og:url') && !html.includes(UNKNOWN_ORIGIN));
  assert.ok(html.includes('href="/guide/"'));
  const configured = '<link rel="canonical" href="https://docs.example.com/guide/">';
  await writeFile(file, configured);
  await finalizeArtifacts(directory, { publicSite: 'https://docs.example.com' });
  assert.equal(await readFile(file, 'utf8'), configured);
});

test('artifact finalization blocks raw, URL-encoded and Basic-auth document credentials without echoing them', async (t) => {
  const directory = await temporaryArtifacts(t);
  const token = 'test-only-secret+/=';
  for (const secret of [token, encodeURIComponent(token), Buffer.from(`x-access-token:${token}`).toString('base64')]) {
    await writeFile(path.join(directory, 'download.bin'), Buffer.concat([Buffer.from([0, 255]), Buffer.from(secret)]));
    await assert.rejects(finalizeArtifacts(directory, { publicSite: 'https://docs.example.com', token }), (error) => /Publishing is blocked/.test(error.message) && !error.message.includes(token));
  }
});

test('artifact digests detect edits, path changes, and deleted files', async (t) => {
  const directory = await temporaryArtifacts(t);
  const original = path.join(directory, 'index.html');
  const moved = path.join(directory, 'guide.html');
  await writeFile(original, 'first page');
  const first = await digestDirectory(directory);
  assert.equal(await digestDirectory(directory), first);
  await writeFile(original, 'updated page');
  const edited = await digestDirectory(directory);
  assert.notEqual(edited, first);
  await rename(original, moved);
  const renamed = await digestDirectory(directory);
  assert.notEqual(renamed, edited);
  await rm(moved);
  assert.notEqual(await digestDirectory(directory), renamed);
});

test('Wrangler public defaults can be overridden by Workers Builds variables and its build secret', async () => {
  assert.deepEqual(await loadSettings({}), {
    repo: 'https://github.com/Azincc/nimbus-docs-template.git', branch: 'main',
    docsPath: 'docs', configPath: 'docs/site.json', siteUrl: undefined, token: undefined,
  });
  assert.deepEqual(await loadSettings({
    DOCS_REPO: 'https://github.com/Azincc/nimbus-docs-template.git', DOCS_BRANCH: 'docs/current',
    DOCS_PATH: 'knowledge', DOCS_CONFIG_PATH: 'website.json', SITE_URL: 'https://docs.example.com/',
    DOCS_TOKEN: 'private-repository-build-secret',
  }), {
    repo: 'https://github.com/Azincc/nimbus-docs-template.git', branch: 'docs/current',
    docsPath: 'knowledge', configPath: 'website.json', siteUrl: 'https://docs.example.com',
    token: 'private-repository-build-secret',
  });
});
