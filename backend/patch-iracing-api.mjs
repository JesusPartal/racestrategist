import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, 'node_modules/iracing-api/lib');

const files = globSync('**/*.js', { cwd: root, withFileTypes: false }).map(f => resolve(root, f));
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
