import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { projectRoot, buildEnvironment, digestDirectory } from './artifacts.mjs';

process.chdir(projectRoot);
try {
  let ready;
  try { ready = JSON.parse(await readFile('.generated/build-ready.json', 'utf8')); }
  catch { throw new Error('No successful build is ready. Run the build command successfully before deploying.'); }
  if (ready.digest !== await digestDirectory('dist')) throw new Error('Build artifacts changed after validation. Rebuild before deploying.');
  console.log(`[deploy] Publishing document commit ${ready.commit}.`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', ...process.argv.slice(2)], { stdio: 'inherit', env: buildEnvironment() });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
  process.exitCode = code;
} catch (error) {
  console.error(`[deploy] ${error.message}`);
  process.exitCode = 1;
}
