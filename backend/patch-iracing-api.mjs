import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...walkDir(full));
    } else if (extname(entry) === '.js') {
      files.push(full);
    }
  }
  return files;
}

const root = 'node_modules/iracing-api/lib';
const files = walkDir(root);
let patched = 0;

const RE_FROM = /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g;
const RE_EXPORT = /(export\s+(?:\*\s+from|{[^}]*}\s+from)\s+['"])(\.\.?\/[^'"]+)(['"])/g;

for (const f of files) {
  let content = readFileSync(f, 'utf-8');
  const orig = content;

  content = content.replace(RE_FROM, (m, prefix, path, suffix) => {
    if (path.endsWith('.js')) return m;
    return prefix + path + '.js' + suffix;
  });

  content = content.replace(RE_EXPORT, (m, prefix, path, suffix) => {
    if (path.endsWith('.js')) return m;
    return prefix + path + '.js' + suffix;
  });

  if (content !== orig) {
    writeFileSync(f, content, 'utf-8');
    patched++;
  }
}

console.log(`Patched ${patched} files in iracing-api`);