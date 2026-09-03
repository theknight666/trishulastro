const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('--- RUNNING TRISHULASTRO INTEGRITY AUDIT ---');

let errors = [];

// 1. Check title and branding
if (!html.includes('TrishulAstro')) {
  errors.push('Missing TrishulAstro in title or branding');
}
if (html.toLowerCase().includes('spaceedu') || html.toLowerCase().includes('space<i>edu</i>')) {
  errors.push('Found legacy spaceedu branding in index.html');
}

// 2. Check Earth removal
if (html.includes("data-planet=\"earth\"") || html.includes("PLANETS = { earth")) {
  errors.push('Earth planet was not removed from planet switcher!');
}

// 3. Check all local assets referenced in HTML exist
const assetRegex = /src=["'](assets\/[^"']+)["']|href=["'](assets\/[^"']+)["']|url\(["']?(assets\/[^"')]+)["']?\)/g;
let match;
const foundAssets = new Set();
while ((match = assetRegex.exec(html)) !== null) {
  const asset = match[1] || match[2] || match[3];
  foundAssets.add(asset);
}

console.log(`Found ${foundAssets.size} local assets referenced in index.html:`);
foundAssets.forEach(asset => {
  const fullPath = path.join(__dirname, asset);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing asset file: ${asset}`);
  } else {
    console.log(`  ✓ Exists: ${asset} (${fs.statSync(fullPath).size} bytes)`);
  }
});

// 4. Check all anchor hrefs #... have matching IDs in HTML
const hrefRegex = /href=["']#([^"']+)["']/g;
const foundHrefs = new Set();
while ((match = hrefRegex.exec(html)) !== null) {
  foundHrefs.add(match[1]);
}

console.log(`\nFound ${foundHrefs.size} anchor targets:`);
foundHrefs.forEach(target => {
  if (target === '' || target === '#') {
    // top of page or controlled by JS
    return;
  }
  const idRegex = new RegExp(`id=["']${target}["']`);
  if (!idRegex.test(html)) {
    errors.push(`Broken anchor link: #${target} (no element with id="${target}")`);
  } else {
    console.log(`  ✓ Valid anchor target: #${target}`);
  }
});

// 5. Check empty buttons or broken buttons
const btnRegex = /<button[^>]*>([\s\S]*?)<\/button>/g;
let btnCount = 0;
while ((match = btnRegex.exec(html)) !== null) {
  btnCount++;
  const content = match[1].trim();
  if (content === '') {
    errors.push(`Found empty button: ${match[0]}`);
  }
}
console.log(`\nAudited ${btnCount} buttons across the application.`);

// 6. Check required planets are in data object
const requiredGrahas = ['venus', 'jupiter', 'mars', 'saturn', 'sun', 'mercury', 'moon'];
requiredGrahas.forEach(graha => {
  if (!html.includes(`${graha}: {`)) {
    errors.push(`Missing Graha in GRAHAS dictionary: ${graha}`);
  } else {
    console.log(`  ✓ Vedic Graha configured: ${graha}`);
  }
});

// 7. Check Booking Modal Steps
for (let i = 1; i <= 5; i++) {
  if (!html.includes(`id="booking-step-${i}"`)) {
    errors.push(`Missing booking modal step: step ${i}`);
  }
}

if (errors.length === 0) {
  console.log('\n=========================================');
  console.log('🎉 ALL TRISHULASTRO INTEGRITY AUDITS PASSED!');
  console.log('=========================================');
  process.exit(0);
} else {
  console.error('\n❌ AUDIT FAILURES DETECTED:');
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}
