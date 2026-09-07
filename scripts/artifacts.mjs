import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { UNKNOWN_ORIGIN } from './site-config.mjs';

export const projectRoot = fileURLToPath(new URL('..', import.meta.url));

export async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(file));
    else if (entry.isFile()) files.push(file);
    else throw new Error('Generated artifacts cannot contain symbolic links.');
  }
  return files.sort();
}

export async function digestDirectory(directory) {
  const hash = createHash('sha256');
  for (const file of await filesIn(directory)) {
    hash.update(path.relative(directory, file).replaceAll('\\', '/'));
    hash.update('\0');
    const bytes = await readFile(file);
    hash.update(String(bytes.length));
    hash.update('\0');
    hash.update(bytes);
  }
  return hash.digest('hex');
}

export async function cleanGenerated(directory) {
  const absolute = path.resolve(directory);
  const relative = path.relative(projectRoot, absolute);
  const allowed = ['.cache', '.generated', '.astro', '.nimbus', 'dist', 'src/content/docs', 'public/_source', 'public/_build.json'];
  const normalized = relative.replaceAll('\\', '/');
  if (!allowed.some(p => normalized === p || normalized.startsWith(p + '/'))) throw new Error('Refusing to remove a path outside the known generated directories.');
  await rm(absolute, { recursive: true, force: true });
}

export function buildEnvironment(env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([key]) => !/^(?:DOCS_TOKEN|NIMBUS_SOURCE_.*|GIT_ASKPASS|GIT_CONFIG_.*|GIT_TRACE.*|GH_TOKEN|GITHUB_TOKEN)$/i.test(key)));
}

export async function finalizeArtifacts(directory, { publicSite, token }) {
  for (const file of await filesIn(directory)) {
    let bytes = await readFile(file);
    if (!publicSite && /\.(?:html|xml|txt|md|mdx|json|js|css)$/i.test(file)) {
      let text = bytes.toString('utf8');
      if (file.endsWith('.html')) {
        text = text.replace(/<link\b(?=[^>]*\brel=["'](?:canonical|sitemap)["'])[^>]*>/gi, '')
          .replace(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/gi, '')
          .replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '');
      }
      text = text.replaceAll(UNKNOWN_ORIGIN, '');
      bytes = Buffer.from(text);
      await writeFile(file, bytes);
    }
    if (token && [token, encodeURIComponent(token), Buffer.from(`x-access-token:${token}`).toString('base64')].some(secret => bytes.includes(Buffer.from(secret)))) {
      throw new Error('A document credential was found in generated artifacts. Publishing is blocked; remove the credential from the source content.');
    }
  }
}
