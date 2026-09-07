import { createIndex, close } from 'pagefind';

export async function buildSearchIndex(directory) {
  try {
    const created = await createIndex();
    if (!created.index || created.errors.length) throw new Error(`Pagefind initialization failed: ${created.errors.join('; ')}`);
    const indexed = await created.index.addDirectory({ path: directory });
    if (indexed.errors.length) throw new Error(`Pagefind indexing failed: ${indexed.errors.join('; ')}`);
    const written = await created.index.writeFiles({ outputPath: `${directory}/pagefind` });
    if (written.errors.length) throw new Error(`Pagefind output failed: ${written.errors.join('; ')}`);
    console.log(`[search] Pagefind index written to ${written.outputPath}.`);
  } finally {
    await close();
  }
}
