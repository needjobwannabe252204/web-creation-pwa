const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const logoDir = path.join(ROOT, 'assets', 'image', 'logo');
const srcLogo = path.join(logoDir, 'app-logo.png');
const sizes = [48, 72, 96, 144, 192, 512];

async function generate() {
  if (!fs.existsSync(srcLogo)) {
    console.error('Source logo not found:', srcLogo);
    process.exit(1);
  }

  console.log('Generating icons from', srcLogo);
  for (const s of sizes) {
    const out = path.join(logoDir, `icon-${s}.png`);
    await sharp(srcLogo).resize(s, s, { fit: 'contain' }).png().toFile(out);
    console.log('Written', out);
  }

  // Update manifest.json
  const manifestPath = path.join(ROOT, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.icons = sizes.map((s) => ({
    src: `/assets/image/logo/icon-${s}.png`,
    sizes: `${s}x${s}`,
    type: 'image/png'
  })).concat([
    { src: '/assets/image/logo/app-logo.png', sizes: '512x512', type: 'image/png' }
  ]);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Updated manifest.json with new icon entries');

  // Update sw.js precache icon entries (between "// icons" and "// nav pages")
  const swPath = path.join(ROOT, 'sw.js');
  let sw = fs.readFileSync(swPath, 'utf8');
  const iconsBlock = sizes.map((s) => `  '/assets/image/logo/icon-${s}.png',`).join('\n') + '\n  \'/assets/image/logo/app-logo.png\',' + '\n  \'/assets/image/logo/cdm-logo.jpeg\',';

  sw = sw.replace(/(\/\/ icons\n)([\s\S]*?)(\n\s*\/\/ nav pages)/, function (_, a, b, c) {
    return a + iconsBlock + c;
  });

  fs.writeFileSync(swPath, sw, 'utf8');
  console.log('Updated sw.js precache icon list');

  console.log('All done. Run the app and update service worker to pick up new cache.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
