import { loadSettings } from './settings.mjs';

try {
  const settings = await loadSettings();
  console.log(JSON.stringify({
    repo: settings.repo,
    branch: settings.branch,
    docsPath: settings.docsPath,
    configPath: settings.configPath || null,
    siteUrl: settings.siteUrl || null,
    tokenPresent: Boolean(settings.token),
    origins: Object.fromEntries(['DOCS_REPO', 'DOCS_BRANCH', 'DOCS_PATH', 'DOCS_CONFIG_PATH', 'SITE_URL'].map(key => [key, process.env[key] === undefined ? 'wrangler.jsonc.vars' : 'build environment'])),
    source: 'Build environment overrides wrangler.jsonc vars; token only comes from build environment.',
  }, null, 2));
} catch (error) {
  console.error(`[config] ${error.message}`);
  process.exitCode = 1;
}
