const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((f) => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, filelist);
    else if (stat.isFile() && full.endsWith('.html')) filelist.push(full);
  });
  return filelist;
}

function normalizeRef(ref, htmlFile) {
  if (!ref) return null;
  // ignore external or data URIs
  if (/^(https?:|mailto:|tel:|data:|#)/.test(ref)) return null;
  if (ref.startsWith('/')) return path.join(ROOT, ref.slice(1));
  return path.join(path.dirname(htmlFile), ref);
}

function findRefs(html) {
  const re = /(?:src|href)\s*=\s*['"]([^'"]+)['"]/gi;
  const refs = [];
  let m;
  while ((m = re.exec(html))) refs.push(m[1]);
  return refs;
}

const htmlFiles = walk(ROOT);
const missing = {};

htmlFiles.forEach((htmlPath) => {
  const content = fs.readFileSync(htmlPath, 'utf8');
  const refs = findRefs(content);
  refs.forEach((r) => {
    const resolved = normalizeRef(r, htmlPath);
    if (!resolved) return;
    if (!fs.existsSync(resolved)) {
      if (!missing[resolved]) missing[resolved] = new Set();
      missing[resolved].add(path.relative(ROOT, htmlPath));
    }
  });
});

const keys = Object.keys(missing);
if (keys.length === 0) {
  console.log('OK: No missing local asset references found in HTML files.');
  process.exit(0);
}

console.log('Missing assets report:\n');
keys.forEach((k) => {
  console.log('- ' + path.relative(ROOT, k));
  missing[k].forEach((htmlFile) => console.log('   referenced from: ' + htmlFile));
});
process.exit(2);
