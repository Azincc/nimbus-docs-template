import { readFile, writeFile } from 'node:fs/promises';
import { readSourceSettings } from './source.mjs';

try {
  const { repo } = readSourceSettings({ DOCS_REPO: process.argv[2] });
  const repoUrl = repo.replace(/\.git$/, '');
  const file = new URL('../README.md', import.meta.url);
  const readme = await readFile(file, 'utf8');
  const pattern = /<!-- deploy-button:start -->[\s\S]*?<!-- deploy-button:end -->/;
  if (!pattern.test(readme)) throw new Error('Deploy button markers were not found in README.md.');
  const button = `[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=${encodeURIComponent(repoUrl)})`;
  await writeFile(file, readme.replace(pattern, `<!-- deploy-button:start -->\n${button}\n<!-- deploy-button:end -->`));
  console.log(`Deploy button configured for ${repoUrl}. Publish this repository before using the button.`);
} catch (error) {
  console.error(`[template] ${error.message}\nUsage: node scripts/configure-template.mjs https://github.com/Azincc/nimbus-docs-template.git`);
  process.exitCode = 1;
}
