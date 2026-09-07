import { readFile, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';

export const UNKNOWN_ORIGIN = 'https://nimbus.invalid';

function object(value, keys, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object.`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`Unknown ${name} field: ${key}`);
}

function string(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be a non-empty string.`);
  return value.trim();
}

function httpUrl(value, name) {
  let url;
  try { url = new URL(string(value, name)); } catch { throw new Error(`${name} must be an HTTP(S) URL.`); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error(`${name} must be an HTTP(S) URL without credentials.`);
  return url.href;
}

export function validateSiteConfig(config) {
  object(config, ['schemaVersion', 'title', 'description', 'locale', 'homeLabel', 'github', 'navigation', 'theme', 'brand'], 'site config');
  if (config.schemaVersion !== 1) throw new Error('Site config schemaVersion must be 1.');
  for (const key of ['title', 'description', 'locale', 'homeLabel']) if (config[key] !== undefined) string(config[key], key);
  if (config.github !== undefined && config.github !== null) httpUrl(config.github, 'github');
  if (config.navigation !== undefined) {
    if (!Array.isArray(config.navigation)) throw new Error('navigation must be an array.');
    for (const item of config.navigation) {
      object(item, ['label', 'link'], 'navigation item');
      string(item.label, 'navigation.label');
      string(item.link, 'navigation.link');
      if (!item.link.startsWith('/') || item.link.startsWith('//')) httpUrl(item.link, 'navigation.link');
    }
  }
  if (config.theme !== undefined) {
    object(config.theme, ['defaultMode', 'accent'], 'theme');
    if (config.theme.defaultMode !== undefined && !['system', 'light', 'dark'].includes(config.theme.defaultMode)) throw new Error('theme.defaultMode must be system, light, or dark.');
    if (config.theme.accent !== undefined && !/^#[\da-f]{6}$/i.test(config.theme.accent)) throw new Error('theme.accent must be a six-digit hex color.');
  }
  if (config.brand !== undefined) {
    object(config.brand, ['logo', 'logoAlt', 'favicon', 'socialImage'], 'brand');
    for (const [key, value] of Object.entries(config.brand)) string(value, `brand.${key}`);
  }
  return config;
}

export async function prepareSiteConfig({ root, settings, content }) {
  let config = { schemaVersion: 1 };
  if (settings.configPath) {
    const target = path.resolve(root, settings.configPath);
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('DOCS_CONFIG_PATH escapes the source repository.');
    let current = root;
    for (const part of relative.split(path.sep)) {
      current = path.join(current, part);
      if ((await lstat(current)).isSymbolicLink()) throw new Error('DOCS_CONFIG_PATH cannot pass through a symlink.');
    }
    const resolvedRelative = path.relative(await realpath(root), await realpath(target));
    if (resolvedRelative.startsWith('..') || path.isAbsolute(resolvedRelative)) throw new Error('DOCS_CONFIG_PATH escapes the source repository.');
    try { config = JSON.parse(await readFile(target, 'utf8')); } catch { throw new Error('DOCS_CONFIG_PATH must point to a valid JSON file.'); }
    validateSiteConfig(config);
  }
  const brand = { ...config.brand };
  for (const key of ['logo', 'favicon', 'socialImage']) {
    if (!brand[key]) continue;
    if (/^https?:\/\//i.test(brand[key])) brand[key] = httpUrl(brand[key], `brand.${key}`);
    else {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(brand[key])) throw new Error(`brand.${key} must be an HTTP(S) URL or a local repository asset.`);
      brand[key] = await content.copyAsset(brand[key], settings.configPath);
    }
  }
  const routes = new Set(content.pages.filter(p => !p.data.draft).map(p => p.route.replace(/\/$/, '') || '/'));
  const navigation = config.navigation ?? [];
  for (const item of navigation) {
    if (!item.link.startsWith('/')) continue;
    let pathname;
    try { pathname = decodeURIComponent(new URL(item.link, UNKNOWN_ORIGIN).pathname); } catch { throw new Error('navigation.link has invalid encoding.'); }
    if (!routes.has(pathname.replace(/\/$/, '') || '/')) throw new Error(`navigation.link does not match a published document: ${item.link}`);
  }
  return {
    nimbus: {
      site: settings.siteUrl || UNKNOWN_ORIGIN,
      title: config.title || settings.repo.split('/').at(-1).replace(/\.git$/, '') + ' Docs',
      description: config.description || 'Documentation',
      locale: config.locale || 'zh-CN',
      homeLabel: config.homeLabel || '首页',
      github: config.github ?? null,
      ...(brand.socialImage ? { socialImage: brand.socialImage } : {}),
      head: brand.favicon ? [{ tag: 'link', attrs: { rel: 'icon', href: brand.favicon } }] : [],
    },
    publicSite: settings.siteUrl || null,
    navigation,
    theme: { defaultMode: 'system', ...config.theme },
    brand,
  };
}
