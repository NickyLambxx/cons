import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const roots = ['.', 'js'];
const files = roots.flatMap((root) => {
  try {
    return readdirSync(root)
      .filter((name) => name.endsWith('.js'))
      .map((name) => join(root, name));
  } catch {
    return [];
  }
});

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`JavaScript syntax OK: ${files.length} files`);
