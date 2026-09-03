const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const checks = [
  ['Earth video clip URL', content.includes('hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4')],
  ['Venus video clip URL', content.includes('hf_20260827_202422_b211cd74-013b-4dd3-bfd0-64491d8696fa.mp4')],
  ['Mars video clip URL', content.includes('hf_20260827_202422_51eae59a-2459-4c84-907c-cc5edfe5fea7.mp4')],
  ['Earth poster URL', content.includes('hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png')],
  ['Venus poster URL', content.includes('hf_20260827_202133_cf55d1d8-7b59-4a64-80da-d72052ae974e.png')],
  ['Mars poster URL', content.includes('hf_20260827_202133_0ba6de7c-285d-43dc-b7ab-8c54c73707cb.png')],
  ['Earth cutout URL', content.includes('hf_20260827_202005_3346cc4d-ec3b-44ab-825c-b18e49f5021a.png')],
  ['Venus cutout URL', content.includes('hf_20260827_202012_640b239a-d08a-4200-adb2-741bbe129ac8.png')],
  ['Mars cutout URL', content.includes('hf_20260827_202018_3d559490-f613-4ed7-a3bb-3b7e9fc90fb8.png')],
  ['Favicon present', content.includes('rel="icon" type="image/png"')],
  ['Blocking entrance script', content.includes("classList.add('anim')")],
  ['Design system variables', content.includes('--dw:1353; --dh:1163; --gutter:25;')],
  ['--u calculation', content.includes('--u:max(min(.72px, calc(100vh / 700))')],
  ['Prata font loaded', content.includes('family=Prata')],
  ['Hanken Grotesk font loaded', content.includes('family=Hanken+Grotesk')],
  ['Poppins font loaded', content.includes('family=Poppins')],
  ['Tution nav link present', content.includes('>Tution</a>')],
  ['3 cutouts in Left button', (content.match(/<button class="planet planet-l"[^>]*>[\s\S]*?<\/button>/) || [''])[0].match(/<img/g)?.length === 3],
  ['3 cutouts in Right button', (content.match(/<button class="planet planet-r"[^>]*>[\s\S]*?<\/button>/) || [''])[0].match(/<img/g)?.length === 3],
  ['Scroll SVG present', content.includes('<path d="M13 1.5 V31.5 M1.9 20.4 L13 31.5 L24.1 20.4"')],
  ['Driver script 2150ms cleanup', content.includes('2150')],
  ['ORDER array', content.includes("const ORDER = ['earth', 'venus', 'mars'];")],
  ['show function bails if unknown or current', content.includes('!PLANETS[next] || current === next')],
  ['setBurger helper manages aria and state', content.includes("navrow.dataset.open = open ? 'true' : 'false'")],
  ['Responsive tiers ordered A-F', (
    content.indexOf('@media (max-width:1030px), (max-height:620px)') <
    content.indexOf('@media (min-width:580px) and (max-width:1030px)') &&
    content.indexOf('@media (min-width:580px) and (max-width:1030px)') <
    content.indexOf('@media (max-width:579px)') &&
    content.indexOf('@media (max-width:579px)') <
    content.indexOf('@media (max-height:660px){ .scroll{display:none} }') &&
    content.indexOf('@media (max-height:660px){ .scroll{display:none} }') <
    content.indexOf('@media (max-height:620px){') &&
    content.indexOf('@media (max-height:620px){') <
    content.indexOf('@media (max-width:500px)')
  )]
];

let allPassed = true;
checks.forEach(([label, pass]) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${label}`);
  if (!pass) allPassed = false;
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log('\nAll 24 automated checks passed successfully!');
}
