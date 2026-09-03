const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('--- AUDITING TRISHULASTRO TRANSPARENT PNG PLANETS BUILD ---');
let errors = [];

// 1. Check title and branding
if (!html.includes('TrishulAstro')) {
  errors.push('Missing TrishulAstro in title or branding');
}
if (html.toLowerCase().includes('spaceedu') || html.toLowerCase().includes('space<i>edu</i>')) {
  errors.push('Found legacy spaceedu branding in index.html');
}

// 2. Check Earth removal
if (html.includes("data-planet=\"earth\"") || html.includes("'earth'")) {
  errors.push('Earth planet was not removed from planet switcher!');
}

// 3. Check all local assets referenced in HTML exist
const assetRegex = /src=["'](assets\/[^"']+)["']|href=["'](assets\/[^"']+)["']|url\(["']?(assets\/[^"')]+)["']?\)/g;
let match;
const foundAssets = new Set();
while ((match = assetRegex.exec(html)) !== null) {
  const asset = match[1] || match[2] || match[3];
  if (asset) foundAssets.add(asset);
}

console.log(`\nFound ${foundAssets.size} local assets referenced in index.html:`);
foundAssets.forEach(asset => {
  const fullPath = path.join(__dirname, asset);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing asset file: ${asset}`);
  } else {
    console.log(`  ✓ Exists: ${asset}`);
  }
});

// 4. Check all anchor targets exist
const hrefRegex = /href=["']#([^"']+)["']/g;
const foundHrefs = new Set();
while ((match = hrefRegex.exec(html)) !== null) {
  foundHrefs.add(match[1]);
}
console.log(`\nFound ${foundHrefs.size} anchor targets:`);
foundHrefs.forEach(target => {
  if (target === '' || target === '#') return;
  const idRegex = new RegExp(`id=["']${target}["']`);
  if (!idRegex.test(html)) {
    errors.push(`Broken anchor link: #${target} (no element with id="${target}")`);
  } else {
    console.log(`  ✓ Valid anchor target: #${target}`);
  }
});

// 5. Check all buttons have non-empty content
const btnRegex = /<button[^>]*>([\s\S]*?)<\/button>/g;
let btnCount = 0;
while ((match = btnRegex.exec(html)) !== null) {
  btnCount++;
  const content = match[1].trim();
  if (content === '') {
    errors.push(`Found empty button: ${match[0]}`);
  }
}
console.log(`\nAudited ${btnCount} buttons.`);

// 6. Check all planets
const requiredGrahas = ['venus', 'mars', 'jupiter', 'saturn', 'sun', 'mercury', 'moon'];
requiredGrahas.forEach(graha => {
  if (!html.includes(`${graha}: {`)) {
    errors.push(`Missing Graha: ${graha}`);
  } else {
    console.log(`  ✓ Graha configured: ${graha}`);
  }
});

// 7. Check all 7 transparent PNG files are used
const transparentFiles = [
  'venus_trans.png', 'mars_trans.png', 'jupiter_trans.png',
  'saturn_trans.png', 'sun_trans.png', 'mercury_trans.png', 'moon_trans.png'
];
transparentFiles.forEach(f => {
  if (!html.includes(`assets/${f}`)) {
    errors.push(`Missing transparent PNG reference: assets/${f}`);
  } else {
    console.log(`  ✓ Using transparent PNG: assets/${f}`);
  }
});

if (errors.length === 0) {
  console.log('\n🎉 ALL 7 TRANSPARENT PLANET PNGS AUDIT PASSED 100%!');
  process.exit(0);
} else {
  console.error('\n❌ AUDIT FAILURES:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}
