import { readFile } from 'node:fs/promises';
import { parse } from 'jsonc-parser';
import { readSourceSettings } from './source.mjs';

export async function loadSettings(env = process.env) {
  const errors = [];
  const config = parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'), errors);
  if (errors.length || !config || typeof config !== 'object') throw new Error('wrangler.jsonc is not valid JSONC.');
  return readSourceSettings(env, config.vars ?? {});
}
