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
  const defaults = { DOCS_REPO: 'https://github.com/Azincc/nimbus-docs-template.git', DOCS_CONFIG_PATH: 'docs/site.json', SITE_LOGO: 'default', SITE_FAVICON: 'default' };
  return { root, assetsDir, content, defaults };
}

test('site JSON validates its defined format instead of accepting arbitrary Nimbus configuration', () => {
  assert.throws(() => validateSiteConfig({ title: 'Docs' }), /schemaVersion/);
  assert.throws(() => validateSiteConfig({ schemaVersion: 1, typo: true }), /Unknown/);
  assert.throws(() => validateSiteConfig({ schemaVersion: 1, theme: { accent: 'red;}' } }), /hex color/);
  assert.throws(() => validateSiteConfig({ schemaVersion: 1, navigation: [{ label: 'Unsafe', link: 'javascript:alert(1)' }] }), /HTTP/);
  assert.equal(validateSiteConfig({ schemaVersion: 1, title: 'Docs', theme: { defaultMode: 'dark' } }).title, 'Docs');
});

test('a source without site JSON builds with generic settings using only the first-deploy inputs', async (t) => {
  const { root, content, defaults } = await brandingFixture(t);
  const inputs = { DOCS_REPO: defaults.DOCS_REPO, DOCS_BRANCH: 'main', DOCS_PATH: 'docs' };
  const site = await prepareSiteConfig({ root, settings: readSourceSettings(inputs), content });
  assert.equal(site.nimbus.title, 'nimbus-docs-template Docs');
  assert.equal(site.publicSite, null);
  assert.equal(site.brand.logo, '/nimbus-logo.svg');
  assert.equal(site.brand.favicon, '/nimbus-logo.svg');
  // Explicitly requesting even the conventional path still requires that file.
  await assert.rejects(prepareSiteConfig({
    root, settings: readSourceSettings({ ...inputs, DOCS_CONFIG_PATH: 'docs/site.json' }), content,
  }), /DOCS_CONFIG_PATH.*does not exist/);
});

test('automatic site JSON preserves local branding and explicit overrides or disabling', async (t) => {
  const { root, content, defaults } = await brandingFixture(t);
  await mkdir(path.join(root, 'docs-zh-CN'));
  await writeFile(path.join(root, 'docs-zh-CN', 'logo.svg'), '<svg id="automatic-logo"/>');
  await writeFile(path.join(root, 'docs-zh-CN', 'site.json'), JSON.stringify({
    schemaVersion: 1, title: '中文文档', locale: 'zh-CN', brand: { logo: './logo.svg' },
  }));
  const inputs = { DOCS_REPO: defaults.DOCS_REPO, DOCS_PATH: 'docs-zh-CN' };
  const automatic = await prepareSiteConfig({ root, settings: readSourceSettings(inputs), content });
  assert.equal(automatic.nimbus.title, '中文文档');
  assert.equal(automatic.nimbus.locale, 'zh-CN');
  assert.equal(automatic.brand.logo, '/_source/docs-zh-CN/logo.svg');
  const overridden = await prepareSiteConfig({ root, settings: readSourceSettings({
    ...inputs, SITE_LOGO: 'https://cdn.example.com/logo.svg', SITE_URL: 'https://docs.example.com',
  }), content });
  assert.equal(overridden.brand.logo, 'https://cdn.example.com/logo.svg');
  assert.equal(overridden.publicSite, 'https://docs.example.com');
  const disabled = await prepareSiteConfig({ root, settings: readSourceSettings({ ...inputs, DOCS_CONFIG_PATH: '' }), content });
  assert.equal(disabled.nimbus.title, 'nimbus-docs-template Docs');
  assert.equal(disabled.brand.logo, '/nimbus-logo.svg');
});

test('automatic site configuration only tolerates missing files, not invalid JSON or schema', async (t) => {
  const { root, content, defaults } = await brandingFixture(t);
  const settings = readSourceSettings({ DOCS_REPO: defaults.DOCS_REPO });
  const file = path.join(root, 'docs', 'site.json');
  await writeFile(file, '{');
  await assert.rejects(prepareSiteConfig({ root, settings, content }), /valid JSON/);
  await writeFile(file, JSON.stringify({ schemaVersion: 2 }));
  await assert.rejects(prepareSiteConfig({ root, settings, content }), /schemaVersion/);
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
    assert.equal(site.brand.logoAlt, undefined);
    assert.equal(site.brand.favicon, '/nimbus-logo.svg');
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

test('default or blank build branding inherits assets relative to the site JSON', async (t) => {
  const { root, assetsDir, content, defaults } = await brandingFixture(t);
  await mkdir(path.join(root, 'docs', 'brand'));
  await writeFile(path.join(root, 'docs', 'brand', 'logo.svg'), '<svg id="json-logo"/>');
  await writeFile(path.join(root, 'docs', 'brand', 'favicon.svg'), '<svg id="json-favicon"/>');
  await writeFile(path.join(root, 'docs', 'site.json'), JSON.stringify({
    schemaVersion: 1, brand: { logo: './brand/logo.svg', favicon: './brand/favicon.svg', logoAlt: 'Custom docs' },
  }));
  for (const env of [{}, { SITE_LOGO: 'default', SITE_FAVICON: 'default' }, { SITE_LOGO: '', SITE_FAVICON: ' \t ' }]) {
    const site = await prepareSiteConfig({ root, settings: readSourceSettings(env, defaults), content });
    assert.equal(site.brand.logo, '/_source/docs/brand/logo.svg');
    assert.equal(site.brand.favicon, '/_source/docs/brand/favicon.svg');
    assert.equal(site.brand.logoAlt, 'Custom docs');
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

test('default and blank branding use template assets when the source has no site JSON or images', async (t) => {
  const { root, content, defaults } = await brandingFixture(t);
  for (const env of [{}, { SITE_LOGO: 'default', SITE_FAVICON: 'default' }, { SITE_LOGO: '', SITE_FAVICON: ' \t ' }]) {
    const settings = readSourceSettings({ DOCS_CONFIG_PATH: '', ...env }, defaults);
    const site = await prepareSiteConfig({ root, settings, content });
    assert.equal(site.brand.logo, '/nimbus-logo.svg');
    assert.equal(site.brand.logoAlt, 'Nimbus');
    assert.equal(site.brand.favicon, '/nimbus-logo.svg');
    assert.deepEqual(site.nimbus.head, [{ tag: 'link', attrs: { rel: 'icon', href: '/nimbus-logo.svg' } }]);
  }
});

test('a single explicit branding override preserves the other template fallback', async (t) => {
  const { root, assetsDir, content, defaults } = await brandingFixture(t);
  await mkdir(path.join(root, 'brand'));
  await writeFile(path.join(root, 'brand', 'favicon.svg'), '<svg id="custom-favicon"/>');
  const logoSite = await prepareSiteConfig({
    root, content, settings: readSourceSettings({ DOCS_CONFIG_PATH: '', SITE_LOGO: 'https://cdn.example.com/logo.svg' }, defaults),
  });
  assert.equal(logoSite.brand.logo, 'https://cdn.example.com/logo.svg');
  assert.equal(logoSite.brand.favicon, '/nimbus-logo.svg');
  const faviconSite = await prepareSiteConfig({
    root, content, settings: readSourceSettings({ DOCS_CONFIG_PATH: '', SITE_FAVICON: 'brand/favicon.svg' }, defaults),
  });
  assert.equal(faviconSite.brand.logo, '/nimbus-logo.svg');
  assert.equal(faviconSite.brand.logoAlt, 'Nimbus');
  assert.equal(faviconSite.brand.favicon, '/_source/brand/favicon.svg');
  assert.deepEqual(faviconSite.nimbus.head, [{ tag: 'link', attrs: { rel: 'icon', href: '/_source/brand/favicon.svg' } }]);
  assert.equal(await readFile(path.join(assetsDir, 'brand', 'favicon.svg'), 'utf8'), '<svg id="custom-favicon"/>');
});
