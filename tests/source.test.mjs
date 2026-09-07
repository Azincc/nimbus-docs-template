import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkoutSource, readSourceSettings } from '../scripts/source.mjs';

const defaults = {
  DOCS_REPO: 'https://github.com/Azincc/nimbus-docs-template.git',
  DOCS_BRANCH: 'main',
  DOCS_PATH: 'docs',
  DOCS_CONFIG_PATH: 'docs/site.json',
};

test('build variables override public defaults and the token comes only from the environment', () => {
  const settings = readSourceSettings({ DOCS_BRANCH: 'docs/update', DOCS_CONFIG_PATH: '', SITE_URL: 'https://docs.example.com/', DOCS_TOKEN: 'test-build-secret' }, defaults);
  assert.deepEqual(settings, {
    repo: 'https://github.com/Azincc/nimbus-docs-template.git',
    branch: 'docs/update', docsPath: 'docs', configPath: undefined,
    siteUrl: 'https://docs.example.com', token: 'test-build-secret',
  });
  assert.equal(readSourceSettings({}, defaults).token, undefined);
  assert.throws(() => readSourceSettings({}, { ...defaults, DOCS_TOKEN: 'must-not-be-public' }), /Workers Builds secret/);
});

test('source settings reject credentials and unsafe locations without echoing secrets', () => {
  for (const repo of [
    'https://secret-value@github.com/owner/repo',
    'https://github.com:443/owner/repo',
    'https://github.com/owner/repo?token=secret-value',
    'https://github.com/owner/repo#secret-value',
    'https://github.com/owner/../repo',
    'https://github.com/owner/repo%2fother',
    'https://github.com.evil.example/owner/repo',
    'git@github.com:owner/repo.git',
  ]) {
    assert.throws(() => readSourceSettings({ DOCS_REPO: repo }, defaults), (error) => /DOCS_REPO/.test(error.message) && !error.message.includes('secret-value'));
  }
  for (const docsPath of ['../outside', '/tmp/docs', 'C:\\docs']) {
    assert.throws(() => readSourceSettings({ DOCS_PATH: docsPath }, defaults), /relative path/);
  }
  assert.throws(() => readSourceSettings({ DOCS_TOKEN: 'secret\npassword=injected' }, defaults), /single-line/);
  assert.throws(() => readSourceSettings({ DOCS_BRANCH: '--upload-pack=command' }, defaults), /branch name/);
  assert.throws(() => readSourceSettings({ SITE_URL: 'https://secret-value@docs.example.com/' }, defaults), (error) => !error.message.includes('secret-value'));
});

test('invalid source settings fail before creating a temporary checkout', async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'nimbus-source-test-'));
  try {
    await assert.rejects(checkoutSource({ repo: 'https://github.com/Azincc/nimbus-docs-template.git', branch: '../bad', workDir }), /branch name/);
    assert.deepEqual(await readdir(workDir), []);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
});
