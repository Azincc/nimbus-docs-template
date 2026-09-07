import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, cp } from 'node:fs/promises';
import path from 'node:path';
import { stringify } from 'yaml';
import { loadSettings } from './settings.mjs';
import { checkoutSource } from './source.mjs';
import { prepareContent } from './content.mjs';
import { prepareSiteConfig } from './site-config.mjs';
import { buildSearchIndex } from './search.mjs';
import { projectRoot, cleanGenerated, buildEnvironment, digestDirectory, finalizeArtifacts } from './artifacts.mjs';

process.chdir(projectRoot);
const dev = process.argv.includes('--dev');
let checkout;
let stage;

try {
  await cleanGenerated('.generated/build-ready.json');
  const settings = await loadSettings();
  const secret = settings.token;
  // The token is retained only by the fetch call and the artifact leak check.
  delete process.env.DOCS_TOKEN;
  console.log(`[source] Fetching configured branch ${settings.branch}.`);
  await mkdir('.cache', { recursive: true });
  checkout = await checkoutSource({ ...settings, workDir: path.resolve('.cache') });
  delete settings.token;
  console.log(`[source] Document commit: ${checkout.sha}`);
  stage = await mkdtemp(path.resolve('.cache', 'prepared-'));
  const content = await prepareContent({ root: checkout.root, docsPath: settings.docsPath, outputDir: path.join(stage, 'docs'), assetsDir: path.join(stage, 'assets') });
  const visible = content.pages.filter(page => !page.data.draft);
  if (!visible.length) throw new Error('The source contains no published Markdown documents.');
  if (!content.pages.some(page => page.route === '/')) {
    const title = '文档';
    const body = visible.map(page => `- [${page.title.replace(/[\[\]\\]/g, '\\$&')}](${page.route})`).join('\n');
    await writeFile(path.join(stage, 'docs', 'index.md'), `---\n${stringify({ title, sidebar: { order: -1 } })}---\n\n${body}\n`);
    content.pages.unshift({ id: 'index', source: null, route: '/', title, data: { title } });
  } else if (content.pages.find(page => page.route === '/').data.draft) {
    throw new Error('The root README/index cannot be a draft. Publish it or remove it to generate a document index.');
  }
  const site = await prepareSiteConfig({ root: checkout.root, settings, content });
  const provenance = { schemaVersion: 1, commit: checkout.sha, branch: settings.branch, builtAt: new Date().toISOString(), pages: content.pages.filter(p => !p.data.draft).length };
  // Replace the complete generated tree so deleted pages, assets and cached entries disappear.
  for (const dir of ['src/content/docs', 'public/_source', '.astro', '.nimbus']) await cleanGenerated(dir);
  await mkdir('src/content', { recursive: true });
  await mkdir('public/_source', { recursive: true });
  await cp(path.join(stage, 'docs'), 'src/content/docs', { recursive: true });
  await cp(path.join(stage, 'assets'), 'public/_source', { recursive: true });
  await mkdir('.generated', { recursive: true });
  await writeFile('.generated/site.json', JSON.stringify(site, null, 2));
  await writeFile('.generated/pages.json', JSON.stringify(content.pages.map(({ id, source, route, title }) => ({ id, source, route, title })), null, 2));
  await writeFile('public/_build.json', JSON.stringify(provenance, null, 2));
  await checkout.cleanup(); checkout = undefined;
  await cleanGenerated(stage); stage = undefined;
  console.log(`[prepare] ${provenance.pages} published pages. ${site.publicSite ? 'SEO origin configured.' : 'SITE_URL is empty: canonical URLs and sitemap are omitted.'}`);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', dev ? 'dev' : 'build'], { stdio: 'inherit', env: buildEnvironment() });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
  if (exitCode !== 0) throw new Error(`Astro ${dev ? 'dev' : 'build'} failed (exit ${exitCode}).`);
  if (!dev) {
    await finalizeArtifacts('dist', { publicSite: site.publicSite, token: secret });
    await buildSearchIndex('dist');
    for (const required of ['dist/index.html', 'dist/404.html', 'dist/pagefind/pagefind.js']) {
      const { access } = await import('node:fs/promises');
      await access(required);
    }
    await writeFile('.generated/build-ready.json', JSON.stringify({ ...provenance, digest: await digestDirectory('dist') }, null, 2));
    console.log(`[build] Ready to publish document commit ${provenance.commit}.`);
  }
} catch (error) {
  console.error(`[build] ${error.message}`);
  process.exitCode = 1;
} finally {
  if (checkout) await checkout.cleanup();
  if (stage) await cleanGenerated(stage);
}
