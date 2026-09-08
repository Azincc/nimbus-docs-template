import { readFile, writeFile } from 'node:fs/promises';
import { readSourceSettings } from './source.mjs';

try {
  const input = (process.argv[2] ?? '').replace(/\/$/, '');
  const match = /^(https:\/\/github\.com\/[^/]+\/[^/]+?)(\/tree\/[a-z\d._~/-]+)?\/?$/i.exec(input);
  if (!match || match[2]?.slice(1).split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error('Use a GitHub HTTPS repository URL or its /tree/branch/template-directory URL.');
  }
  const { repo } = readSourceSettings({ DOCS_REPO: match[1] });
  const repoUrl = repo.replace(/\.git$/, '') + (match[2] ?? '');
  const pattern = /<!-- deploy-button:start -->[\s\S]*?<!-- deploy-button:end -->/;
  const documents = await Promise.all(['README.md', 'README.zh-CN.md', 'docs/getting-started.md', 'docs-zh-CN/getting-started.md'].map(async (path) => {
    const file = new URL(`../${path}`, import.meta.url);
    const content = await readFile(file, 'utf8');
    if (!pattern.test(content)) throw new Error(`Deploy button markers were not found in ${path}.`);
    return { file, content };
  }));
  const button = `[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=${repoUrl})`;
  for (const { file, content } of documents) {
    await writeFile(file, content.replace(pattern, `<!-- deploy-button:start -->\n${button}\n<!-- deploy-button:end -->`));
  }
  console.log(`Deploy buttons configured for ${repoUrl}. Publish this repository before using the buttons.`);
} catch (error) {
  console.error(`[template] ${error.message}\nUsage: node scripts/configure-template.mjs https://github.com/Azincc/nimbus-docs-template.git`);
  process.exitCode = 1;
}
