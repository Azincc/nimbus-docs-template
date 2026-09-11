import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import { checkoutSource, readSourceSettings } from '../scripts/source.mjs';

const defaults = {
  DOCS_REPO: 'https://github.com/Azincc/nimbus-docs-template.git',
  DOCS_BRANCH: 'main',
  DOCS_PATH: 'docs',
  DOCS_CONFIG_PATH: 'docs/site.json',
  SITE_LOGO: 'default',
  SITE_FAVICON: 'default',
};

test('build variables override public defaults and the token comes only from the environment', () => {
  const settings = readSourceSettings({ DOCS_BRANCH: 'docs/update', DOCS_CONFIG_PATH: '', SITE_URL: 'https://docs.example.com/', DOCS_TOKEN: 'test-build-secret' }, defaults);
  assert.deepEqual(settings, {
    repo: 'https://github.com/Azincc/nimbus-docs-template.git',
    branch: 'docs/update', docsPath: 'docs', configPath: undefined, configPathOptional: false,
    siteUrl: 'https://docs.example.com', siteLogo: 'default', siteFavicon: 'default', token: 'test-build-secret',
  });
  assert.equal(readSourceSettings({}, defaults).token, undefined);
  assert.throws(() => readSourceSettings({}, { ...defaults, DOCS_TOKEN: 'must-not-be-public' }), /Workers Builds secret/);
});

test('automatic site configuration follows the document directory unless a path is explicitly configured', () => {
  const sourceDefaults = { DOCS_REPO: defaults.DOCS_REPO };
  for (const [docsPath, configPath] of [['docs', 'docs/site.json'], ['docs-zh-CN', 'docs-zh-CN/site.json'], ['.', 'site.json']]) {
    const settings = readSourceSettings({ DOCS_PATH: docsPath }, sourceDefaults);
    assert.equal(settings.configPath, configPath);
    assert.equal(settings.configPathOptional, true);
    assert.equal(settings.siteUrl, undefined);
    assert.equal(settings.siteLogo, undefined);
    assert.equal(settings.siteFavicon, undefined);
  }
  const existing = readSourceSettings({ DOCS_PATH: 'knowledge' }, defaults);
  assert.equal(existing.configPath, 'docs/site.json');
  assert.equal(existing.configPathOptional, false);
  const explicit = readSourceSettings({ DOCS_CONFIG_PATH: 'docs/site.json' }, sourceDefaults);
  assert.equal(explicit.configPathOptional, false);
});

test('branding build variables override public defaults and blank values defer to site JSON', () => {
  const brandingDefaults = { ...defaults, SITE_LOGO: 'https://cdn.example.com/logo.svg', SITE_FAVICON: 'brand/favicon.svg' };
  const inherited = readSourceSettings({}, brandingDefaults);
  assert.equal(inherited.siteLogo, 'https://cdn.example.com/logo.svg');
  assert.equal(inherited.siteFavicon, 'brand/favicon.svg');
  const overridden = readSourceSettings({ SITE_LOGO: 'brand/logo.svg', SITE_FAVICON: 'http://cdn.example.com/favicon.svg' }, brandingDefaults);
  assert.equal(overridden.siteLogo, 'brand/logo.svg');
  assert.equal(overridden.siteFavicon, 'http://cdn.example.com/favicon.svg');
  const cleared = readSourceSettings({ SITE_LOGO: ' \t ', SITE_FAVICON: '' }, brandingDefaults);
  assert.equal(cleared.siteLogo, undefined);
  assert.equal(cleared.siteFavicon, undefined);
});

test('branding settings reject credential URLs, other protocols and paths outside the repository', () => {
  for (const key of ['SITE_LOGO', 'SITE_FAVICON']) {
    for (const value of [
      'https://secret-value@cdn.example.com/logo.svg',
      'ftp://cdn.example.com/logo.svg',
      'data:image/svg+xml,svg',
      '../outside.svg', '/brand/logo.svg', 'C:\\brand\\logo.svg', '//cdn.example.com/logo.svg',
    ]) {
      assert.throws(() => readSourceSettings({ [key]: value }, defaults), (error) => error.message.includes(key) && !error.message.includes('secret-value'));
    }
  }
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
