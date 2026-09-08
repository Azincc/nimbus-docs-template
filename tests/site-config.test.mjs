import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateSiteConfig, prepareSiteConfig } from '../scripts/site-config.mjs';
import { prepareContent } from '../scripts/content.mjs';
import { readSourceSettings } from '../scripts/source.mjs';

async function brandingFixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'nimbus-branding-test-'));
  t.onTestFinished(() => rm(directory, { recursive: true, force: true }));
  const root = path.join(directory, 'repo');
  const assetsDir = path.join(directory, 'assets');
  await mkdir(path.join(root, 'docs'), { recursive: true });
  await writeFile(path.join(root, 'docs', 'README.md'), '# Start\n\nWelcome.');
  const content = await prepareContent({ root, docsPath: 'docs', outputDir: path.join(directory, 'prepared'), assetsDir });
  const defaults = { DOCS_REPO: 'https://github.com/Azincc/nimbus-docs-template.git', DOCS_CONFIG_PATH: 'docs/site.json' };
  return { root, assetsDir, content, defaults };
}

test('site JSON validates its defined format instead of accepting arbitrary Nimbus configuration', () => {
  assert.throws(() => validateSiteConfig({ title: 'Docs' }), /schemaVersion/);
  assert.throws(() => validateSiteConfig({ schemaVersion: 1, typo: true }), /Unknown/);
  assert.throws(() => validateSiteConfig({ schemaVersion: 1, theme: { accent: 'red;}' } }), /hex color/);
  assert.throws(() => validateSiteConfig({ schemaVersion: 1, navigation: [{ label: 'Unsafe', link: 'javascript:alert(1)' }] }), /HTTP/);
  assert.equal(validateSiteConfig({ schemaVersion: 1, title: 'Docs', theme: { defaultMode: 'dark' } }).title, 'Docs');
});

test('site configuration maps navigation, branding and SEO from a source repository', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'nimbus-site-test-'));
  try {
    const root = path.join(directory, 'repo');
    await mkdir(path.join(root, 'docs'), { recursive: true });
    await mkdir(path.join(root, 'brand'));
    await writeFile(path.join(root, 'docs', 'README.md'), '# Start\n\nWelcome.');
    await writeFile(path.join(root, 'brand', 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const config = { schemaVersion: 1, title: 'My docs', brand: { logo: './brand/logo.svg' }, navigation: [{ label: 'Start', link: '/' }], theme: { defaultMode: 'dark', accent: '#abcdef' } };
    await writeFile(path.join(root, 'site.json'), JSON.stringify(config));
    const settings = { repo: 'https://github.com/Azincc/nimbus-docs-template.git', configPath: 'site.json', siteUrl: 'https://docs.example.org' };
    const content = await prepareContent({ root, docsPath: 'docs', outputDir: path.join(directory, 'docs'), assetsDir: path.join(directory, 'assets') });
    const site = await prepareSiteConfig({ root, settings, content });
    assert.equal(site.nimbus.title, 'My docs');
    assert.equal(site.nimbus.site, settings.siteUrl);
    assert.equal(site.brand.logo, '/_source/brand/logo.svg');
    assert.equal(site.theme.defaultMode, 'dark');
    config.navigation[0].link = '/deleted';
    await writeFile(path.join(root, 'site.json'), JSON.stringify(config));
    await assert.rejects(prepareSiteConfig({ root, settings, content }), /published document/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('build branding overrides missing JSON assets and resolves local overrides from the repository root', async (t) => {
  const { root, assetsDir, content, defaults } = await brandingFixture(t);
  await mkdir(path.join(root, 'brand'));
  await writeFile(path.join(root, 'brand', 'favicon.svg'), '<svg id="build-favicon"/>');
  await writeFile(path.join(root, 'docs', 'site.json'), JSON.stringify({
    schemaVersion: 1,
    brand: { logo: './missing-logo.svg', favicon: './missing-favicon.svg', logoAlt: 'Preserved label' },
  }));
  const settings = readSourceSettings({ SITE_LOGO: 'https://cdn.example.com/logo.svg', SITE_FAVICON: 'brand/favicon.svg' }, defaults);
  const site = await prepareSiteConfig({ root, settings, content });
  assert.equal(site.brand.logo, 'https://cdn.example.com/logo.svg');
  assert.equal(site.brand.favicon, '/_source/brand/favicon.svg');
  assert.equal(site.brand.logoAlt, 'Preserved label');
  assert.deepEqual(site.nimbus.head, [{ tag: 'link', attrs: { rel: 'icon', href: '/_source/brand/favicon.svg' } }]);
  assert.equal(await readFile(path.join(assetsDir, 'brand', 'favicon.svg'), 'utf8'), '<svg id="build-favicon"/>');
});

test('unset or blank build branding inherits assets relative to the site JSON', async (t) => {
  const { root, assetsDir, content, defaults } = await brandingFixture(t);
  await mkdir(path.join(root, 'docs', 'brand'));
  await writeFile(path.join(root, 'docs', 'brand', 'logo.svg'), '<svg id="json-logo"/>');
  await writeFile(path.join(root, 'docs', 'brand', 'favicon.svg'), '<svg id="json-favicon"/>');
  await writeFile(path.join(root, 'docs', 'site.json'), JSON.stringify({
    schemaVersion: 1, brand: { logo: './brand/logo.svg', favicon: './brand/favicon.svg' },
  }));
  for (const env of [{}, { SITE_LOGO: '', SITE_FAVICON: ' \t ' }]) {
    const site = await prepareSiteConfig({ root, settings: readSourceSettings(env, defaults), content });
    assert.equal(site.brand.logo, '/_source/docs/brand/logo.svg');
    assert.equal(site.brand.favicon, '/_source/docs/brand/favicon.svg');
    assert.deepEqual(site.nimbus.head, [{ tag: 'link', attrs: { rel: 'icon', href: '/_source/docs/brand/favicon.svg' } }]);
  }
  assert.equal(await readFile(path.join(assetsDir, 'docs', 'brand', 'logo.svg'), 'utf8'), '<svg id="json-logo"/>');
  assert.equal(await readFile(path.join(assetsDir, 'docs', 'brand', 'favicon.svg'), 'utf8'), '<svg id="json-favicon"/>');
});

test('local build logo and favicon are copied without a site JSON file', async (t) => {
  const { root, assetsDir, content, defaults } = await brandingFixture(t);
  await mkdir(path.join(root, 'brand'));
  await writeFile(path.join(root, 'brand', 'logo.svg'), '<svg id="build-logo"/>');
  await writeFile(path.join(root, 'brand', 'favicon.svg'), '<svg id="build-favicon"/>');
  const settings = readSourceSettings({ DOCS_CONFIG_PATH: '', SITE_LOGO: 'brand/logo.svg', SITE_FAVICON: 'brand/favicon.svg' }, defaults);
  const site = await prepareSiteConfig({ root, settings, content });
  assert.equal(site.brand.logo, '/_source/brand/logo.svg');
  assert.equal(site.brand.favicon, '/_source/brand/favicon.svg');
  assert.deepEqual(site.nimbus.head, [{ tag: 'link', attrs: { rel: 'icon', href: '/_source/brand/favicon.svg' } }]);
  assert.equal(await readFile(path.join(assetsDir, 'brand', 'logo.svg'), 'utf8'), '<svg id="build-logo"/>');
  assert.equal(await readFile(path.join(assetsDir, 'brand', 'favicon.svg'), 'utf8'), '<svg id="build-favicon"/>');
});
