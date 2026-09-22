/**
 * Frees disk space in BAS / local workspace. Safe to run anytime; reinstall with npm run setup.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const remove = [
  'gen',
  'target',
  'mta_archives',
  'node_modules',
  'app/library-ui/node_modules',
  'app/library-ui/dist',
  'app/router/node_modules',
  'app/router/resources',
  'db.sqlite',
  'db.sqlite-shm',
  'db.sqlite-wal',
];

for (const name of remove) {
  const p = path.join(root, name);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('removed:', name);
  } catch (e) {
    console.warn('skip:', name, e.message);
  }
}

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (
    entry.isDirectory() &&
    (entry.name.endsWith('_mta_build_tmp') || entry.name.includes('_mta_build_tmp'))
  ) {
    const p = path.join(root, entry.name);
    fs.rmSync(p, { recursive: true, force: true });
    console.log('removed:', entry.name);
  }
}

console.log('\nDone. Restore with: npm run setup');
