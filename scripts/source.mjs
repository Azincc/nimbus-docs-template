import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

function setting(env, defaults, key, fallback = '') {
  const value = env[key] ?? defaults[key] ?? fallback;
  if (typeof value !== 'string') throw new Error(`${key} must be a string.`);
  return value.trim();
}

function repositoryUrl(value) {
  // Match the original string, before URL parsing can normalize credentials,
  // encoded separators, dot segments, ports, or a different transport.
  const match = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d-]{0,37}[a-z\d])?)\/([a-z\d._-]+?)(?:\.git)?\/?$/i.exec(value);
  if (!match || match[2].length > 100 || /^\.+$/.test(match[2])) {
    throw new Error('DOCS_REPO must be an HTTPS GitHub repository URL, for example https://github.com/Azincc/nimbus-docs-template.git. Credentials, ports, query strings, and fragments are not allowed.');
  }
  return `https://github.com/${match[1]}/${match[2]}.git`;
}

function branchName(value) {
  if (!value || value.startsWith('-') || value === '@' || value === 'HEAD'
    || /[\x00-\x20\x7f~^:?*\[\\]/.test(value) || value.includes('..')
    || value.includes('@{') || value.split('/').some((part) => !part || part.startsWith('.') || part.endsWith('.') || part.endsWith('.lock'))) {
    throw new Error('DOCS_BRANCH must be a valid Git branch name (not a tag, commit SHA, or HEAD).');
  }
  return value;
}

function repositoryPath(value, key) {
  const normalized = value.replaceAll('\\', '/');
  if (!normalized || normalized.startsWith('/') || /[:\x00-\x1f\x7f]/.test(normalized)
    || normalized.split('/').includes('..')) {
    throw new Error(`${key} must be a relative path inside the document repository.`);
  }
  return path.posix.normalize(normalized).replace(/\/$/, '') || '.';
}

function publicSiteUrl(value) {
  if (!value) return undefined;
  let url;
  try { url = new URL(value); } catch { throw new Error('SITE_URL must be a public HTTP or HTTPS origin.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.search || url.hash || url.pathname !== '/') {
    throw new Error('SITE_URL must be a public HTTP or HTTPS origin without credentials, a path, query string, or fragment.');
  }
  return url.origin;
}

function sourceToken(value) {
  if (value == null || value === '') return undefined;
  if (typeof value !== 'string' || /[\x00-\x1f\x7f]/.test(value)) {
    throw new Error('DOCS_TOKEN must be a single-line build secret.');
  }
  return value.trim() || undefined;
}

/** Public wrangler.jsonc.vars defaults are overridden by Workers Builds variables. */
export function readSourceSettings(env = process.env, defaults = {}) {
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) {
    throw new Error('The public defaults in wrangler.jsonc.vars must be a JSON object.');
  }
  if (Object.hasOwn(defaults, 'DOCS_TOKEN') || Object.hasOwn(defaults, 'token')) {
    throw new Error('Do not put DOCS_TOKEN in the public defaults in wrangler.jsonc.vars. Configure it as a Workers Builds secret.');
  }
  const configPath = setting(env, defaults, 'DOCS_CONFIG_PATH');
  return {
    repo: repositoryUrl(setting(env, defaults, 'DOCS_REPO')),
    branch: branchName(setting(env, defaults, 'DOCS_BRANCH', 'main') || 'main'),
    docsPath: repositoryPath(setting(env, defaults, 'DOCS_PATH', 'docs') || 'docs', 'DOCS_PATH'),
    configPath: configPath ? repositoryPath(configPath, 'DOCS_CONFIG_PATH') : undefined,
    siteUrl: publicSiteUrl(setting(env, defaults, 'SITE_URL')),
    token: sourceToken(env.DOCS_TOKEN),
  };
}

// Git invokes this temporary helper through its own bundled shell on Windows.
// The command is constant; executable/file paths and the token are never assembled
// into shell source. Only the fetch process (and its credential helper) gets token.
const CREDENTIAL_HELPER = `
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  if (process.argv[2] !== 'get') return;
  const fields = Object.fromEntries(input.trim().split('\\n').map(line => {
    const index = line.indexOf('=');
    return [line.slice(0, index), line.slice(index + 1).replace(/\\r$/, '')];
  }));
  if (fields.protocol !== 'https' || fields.host !== 'github.com'
    || fields.path !== process.env.NIMBUS_SOURCE_REPO_PATH) return;
  const token = process.env.NIMBUS_SOURCE_TOKEN;
  if (token) process.stdout.write('username=x-access-token\\npassword=' + token + '\\n\\n');
});
`;

function gitEnvironment(directory) {
  const environment = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (/^(?:GIT_|GCM_|NIMBUS_SOURCE_|DYLD_)/i.test(key)
      || /^(?:DOCS_TOKEN|GH_TOKEN|GITHUB_TOKEN|NODE_OPTIONS|NODE_PATH|BASH_ENV|ENV|LD_PRELOAD|LD_LIBRARY_PATH|SSLKEYLOGFILE)$/i.test(key)) continue;
    environment[key] = value;
  }
  return {
    ...environment,
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: path.join(directory, 'empty.gitconfig'),
    GIT_CONFIG_SYSTEM: path.join(directory, 'empty.gitconfig'),
    GIT_TERMINAL_PROMPT: '0',
    GCM_INTERACTIVE: 'Never',
    NIMBUS_SOURCE_NODE: process.execPath.replaceAll('\\', '/'),
    NIMBUS_SOURCE_HELPER: path.join(directory, 'credential-helper.cjs').replaceAll('\\', '/'),
    // Keep diagnostics predictable, while never forwarding raw stderr to logs.
    LC_ALL: 'C',
  };
}

async function terminateGitProcessTree(child, environment) {
  if (!child.pid) return Promise.resolve();
  if (process.platform !== 'win32') {
    // Every Git invocation has its own process group, including transport and
    // credential-helper children, so timeout cleanup cannot leave them running.
    try { process.kill(-child.pid, 'SIGKILL'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
    return Promise.resolve();
  }
  const cleanupEnvironment = { ...environment };
  delete cleanupEnvironment.NIMBUS_SOURCE_TOKEN;
  return new Promise((resolve, reject) => {
    // Git for Windows launches a second git.exe plus transport/index-pack
    // children. Killing only the outer process leaves the repository locked.
    const terminator = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      env: cleanupEnvironment, shell: false, windowsHide: true, stdio: 'ignore',
    });
    terminator.once('error', () => reject(new Error('Unable to terminate the timed-out Git process tree.')));
    terminator.once('close', (code) => {
      if (code === 0 || child.exitCode !== null) resolve();
      else reject(new Error('Unable to terminate the timed-out Git process tree.'));
    });
  });
}

function runGit(args, environment, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, env: environment, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let termination = Promise.resolve();
    const timeout = setTimeout(() => {
      timedOut = true;
      termination = terminateGitProcessTree(child, environment).catch((error) => {
        child.kill();
        reject(error);
      });
    }, 300_000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { if (stdout.length < 65_536) stdout += chunk; });
    child.stderr.on('data', (chunk) => { if (stderr.length < 65_536) stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(error.code === 'ENOENT' ? 'Git is required to fetch the document repository. Install Git in the build environment.' : 'Unable to start Git in the build environment.'));
    });
    child.on('close', async (code) => {
      clearTimeout(timeout);
      // Wait for taskkill to release every Windows child before removing files.
      await termination;
      if (code === 0 && !timedOut) return resolve(stdout.trim());
      // Do not include raw stderr, arguments, or the original exception: these
      // can contain credentials from a transport or a malformed input.
      let detail = 'Check DOCS_REPO, DOCS_BRANCH, network access, and repository read permissions.';
      if (timedOut) detail = 'The repository fetch timed out after five minutes.';
      else if (/couldn.t find remote ref|remote branch .+ not found/i.test(stderr)) detail = 'DOCS_BRANCH was not found. Use an existing branch name in the document repository.';
      else if (/authentication failed|could not read username|repository not found|access denied/i.test(stderr)) detail = 'The repository is unavailable or access was denied. For private repositories, set DOCS_TOKEN as a Workers Builds secret with repository read permission.';
      else if (/could not resolve|failed to connect|SSL certificate|unable to access/i.test(stderr)) detail = 'GitHub could not be reached. Check network access and the HTTPS repository address.';
      reject(new Error(`Document source fetch failed. ${detail}`));
    });
  });
}

/** Fetch the current branch tip into an isolated, shallow temporary repository. */
export async function checkoutSource({ repo, branch = 'main', token, workDir = tmpdir() }) {
  const url = repositoryUrl(repo);
  const sourceBranch = branchName(branch);
  const secret = sourceToken(token);
  const base = path.resolve(workDir);
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, 'nimbus-source-'));
  const root = path.join(directory, 'repository');
  const cleanup = () => rm(directory, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 });
  try {
    await Promise.all([
      mkdir(path.join(directory, 'empty-hooks')),
      mkdir(path.join(directory, 'empty-template')),
      writeFile(path.join(directory, 'empty.gitconfig'), '', { mode: 0o600 }),
      writeFile(path.join(directory, 'credential-helper.cjs'), CREDENTIAL_HELPER, { mode: 0o600 }),
    ]);
    const environment = gitEnvironment(directory);
    const options = [
      '-c', `core.hooksPath=${path.join(directory, 'empty-hooks').replaceAll('\\', '/')}`,
      '-c', `init.templateDir=${path.join(directory, 'empty-template').replaceAll('\\', '/')}`,
      '-c', 'credential.helper=',
      '-c', 'credential.helper=!"$NIMBUS_SOURCE_NODE" "$NIMBUS_SOURCE_HELPER"',
      '-c', 'credential.useHttpPath=true',
      '-c', 'credential.interactive=false',
      '-c', 'core.askPass=',
      '-c', 'http.followRedirects=false',
      '-c', 'protocol.allow=never',
      '-c', 'protocol.https.allow=always',
      '-c', 'fetch.recurseSubmodules=false',
    ];
    await runGit([...options, 'init', '--quiet', root], environment, base);
    await runGit([...options, '-C', root, 'fetch', '--quiet', '--depth=1', '--no-tags', '--no-recurse-submodules', '--', url, `+refs/heads/${sourceBranch}:refs/remotes/origin/source`], {
      ...environment,
      NIMBUS_SOURCE_REPO_PATH: new URL(url).pathname.slice(1),
      ...(secret ? { NIMBUS_SOURCE_TOKEN: secret } : {}),
    }, base);
    await runGit([...options, '-C', root, 'checkout', '--quiet', '--detach', '--force', 'refs/remotes/origin/source'], environment, base);
    const sha = await runGit([...options, '-C', root, 'rev-parse', '--verify', 'HEAD'], environment, base);
    if (!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(sha)) throw new Error('Git did not return a valid document commit SHA.');
    return { root, sha, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
