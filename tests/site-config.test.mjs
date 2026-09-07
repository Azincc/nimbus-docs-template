import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateSiteConfig, prepareSiteConfig } from '../scripts/site-config.mjs';
import { prepareContent } from '../scripts/content.mjs';

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
