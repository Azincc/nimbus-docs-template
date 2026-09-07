import { readFile, writeFile } from 'node:fs/promises';
import { readSourceSettings } from './source.mjs';

try {
  const { repo } = readSourceSettings({ DOCS_REPO: process.argv[2] });
  const repoUrl = repo.replace(/\.git$/, '');
  const pattern = /<!-- deploy-button:start -->[\s\S]*?<!-- deploy-button:end -->/;
  const documents = await Promise.all(['README.md', 'docs/getting-started.md'].map(async (path) => {
    const file = new URL(`../${path}`, import.meta.url);
    const content = await readFile(file, 'utf8');
    if (!pattern.test(content)) throw new Error(`Deploy button markers were not found in ${path}.`);
    return { file, content };
  }));
  const button = `[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=${encodeURIComponent(repoUrl)})`;
  for (const { file, content } of documents) {
    await writeFile(file, content.replace(pattern, `<!-- deploy-button:start -->\n${button}\n<!-- deploy-button:end -->`));
  }
  console.log(`Deploy buttons configured for ${repoUrl}. Publish this repository before using the buttons.`);
} catch (error) {
  console.error(`[template] ${error.message}\nUsage: node scripts/configure-template.mjs https://github.com/Azincc/nimbus-docs-template.git`);
  process.exitCode = 1;
}
