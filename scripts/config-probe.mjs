import { loadPublicDefaults } from './settings.mjs';
import { readSourceSettings } from './source.mjs';

try {
  const defaults = await loadPublicDefaults();
  const settings = readSourceSettings(process.env, defaults);
  console.log(JSON.stringify({
    repo: settings.repo,
    branch: settings.branch,
    docsPath: settings.docsPath,
    configPath: settings.configPath || null,
    configMode: settings.configPathOptional ? 'automatic (file optional)' : settings.configPath ? 'explicit (file required)' : 'disabled',
    siteUrl: settings.siteUrl || null,
    siteLogo: settings.siteLogo || null,
    siteFavicon: settings.siteFavicon || null,
    tokenPresent: Boolean(settings.token),
    origins: Object.fromEntries(['DOCS_REPO', 'DOCS_BRANCH', 'DOCS_PATH', 'DOCS_CONFIG_PATH', 'SITE_URL', 'SITE_LOGO', 'SITE_FAVICON'].map(key => [key,
      process.env[key] !== undefined ? 'build environment' : defaults[key] != null ? 'wrangler.jsonc.vars' : 'automatic default',
    ])),
    source: 'Build environment overrides wrangler.jsonc vars, then automatic defaults; token only comes from build environment.',
  }, null, 2));
} catch (error) {
  console.error(`[config] ${error.message}`);
  process.exitCode = 1;
}
