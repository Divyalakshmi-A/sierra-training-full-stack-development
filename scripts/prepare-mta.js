/**
 * Builds CAP gen/ + React dist into app/router/resources, then frees node_modules
 * so `mbt build` can zip small folders on a 3 GB BAS disk.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(cmd, opts = {}) {
  console.log('\n>', cmd);
  execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env, shell: true, ...opts });
}

function rm(rel) {
  try {
    fs.rmSync(path.join(root, rel), { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    console.log('removed', rel);
  } catch (err) {
    console.warn(`warning: could not remove ${rel}:`, err.message);
  }
}

function npmInstall(prefix) {
  const lockPath = prefix ? path.join(root, prefix, 'package-lock.json') : path.join(root, 'package-lock.json');
  const prefixArg = prefix ? ` --prefix ${prefix}` : '';
  const command = fs.existsSync(lockPath) ? 'ci' : 'install';
  run(`${npm} ${command}${prefixArg} --no-audit --no-fund`);
}

function copyDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

rm('.Full_Stack_mta_build_tmp');
rm('mta_archives');
rm('gen');
rm('app/router/resources');

if (!fs.existsSync(path.join(root, 'app/library-ui/node_modules'))) {
  npmInstall('app/library-ui');
}
run(`${npm} run build --prefix app/library-ui`);
copyDir(path.join(root, 'app/library-ui/dist'), path.join(root, 'app/router/resources'));

const builtIndex = fs.readFileSync(path.join(root, 'app/router/resources/index.html'), 'utf8');
if (builtIndex.includes('/src/main.jsx')) {
  throw new Error(
    'Vite did not rewrite index.html. Approuter would show a blank page. Check npm run build --prefix app/library-ui',
  );
}
if (!builtIndex.includes('assets/')) {
  throw new Error('Built index.html has no /assets/ script. UI build is incomplete.');
}

if (!fs.existsSync(path.join(root, 'node_modules'))) {
  npmInstall();
}
run(`npx cds build --production`);

console.log('\nprepare-mta done. gen/ and app/router/resources are ready.');
