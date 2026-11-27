// Some hosts (e.g. Cloudflare Pages) skip any folder named "node_modules" when uploading.
// Expo puts web assets such as the SQLite .wasm file under assets/node_modules, so move them and fix the links.
const fs = require('fs');
const path = require('path');

const out = process.argv[2] || 'dist';
const from = path.join(out, 'assets', 'node_modules');
const to = path.join(out, 'assets', 'nm');
if (fs.existsSync(from)) {
  fs.renameSync(from, to);
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
  let n = 0;
  for (const f of walk(out)) {
    if (!/\.(js|html|json|css)$/.test(f)) continue;
    const s = fs.readFileSync(f, 'utf8');
    if (s.includes('assets/node_modules/')) { fs.writeFileSync(f, s.split('assets/node_modules/').join('assets/nm/')); n++; }
  }
  console.log(`web-postbuild: moved assets/node_modules -> assets/nm, updated ${n} files`);
}
