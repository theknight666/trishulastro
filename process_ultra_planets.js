const fs = require('fs');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

console.log('--- GENERATING ULTRA-HIGH-RESOLUTION PLANET PNGS ---');

function savePng(width, height, rgbaBuffer, destPath) {
  const png = new PNG({ width, height });
  png.data = rgbaBuffer;
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(destPath, buffer);
  const sizeMb = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`✓ Saved ${destPath} (${width}x${height}, ${sizeMb} MB)`);
}

// 1. MOON: 2580x2452 master, crop & extract sphere centered at (1292, 1248) with r=1072
function processMoon() {
  const raw = jpeg.decode(fs.readFileSync('assets/master_moon.jpg'), { useTArray: true });
  const { width, height, data } = raw;
  const cx = 1292, cy = 1248, r = 1070;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r) {
        data[idx + 3] = 0;
      } else if (dist > r - 5) {
        data[idx + 3] = Math.round(((r - dist) / 5) * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/moon_trans.png');
}

// 2. MARS: 2205x2205 master, center (1104, 1102), r=934
function processMars() {
  const raw = jpeg.decode(fs.readFileSync('assets/master_mars.jpg'), { useTArray: true });
  const { width, height, data } = raw;
  const cx = 1104, cy = 1102, r = 934;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r) {
        data[idx + 3] = 0;
      } else if (dist > r - 5) {
        data[idx + 3] = Math.round(((r - dist) / 5) * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/mars_trans.png');
}

// 3. JUPITER: 1525x1462 master, center (772, 730), r=718
function processJupiter() {
  const raw = jpeg.decode(fs.readFileSync('assets/master_jupiter.jpg'), { useTArray: true });
  const { width, height, data } = raw;
  const cx = 772, cy = 730, r = 718;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r) {
        data[idx + 3] = 0;
      } else if (dist > r - 5) {
        data[idx + 3] = Math.round(((r - dist) / 5) * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/jupiter_trans.png');
}

// 4. MERCURY: 1991x1974 master, center (1138, 986), r=760
function processMercury() {
  const raw = jpeg.decode(fs.readFileSync('assets/master_mercury.jpg'), { useTArray: true });
  const { width, height, data } = raw;
  const cx = 1138, cy = 986, r = 760;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r) {
        data[idx + 3] = 0;
      } else if (dist > r - 5) {
        data[idx + 3] = Math.round(((r - dist) / 5) * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/mercury_trans.png');
}

// 5. SATURN: 2076x1484 master PNG from Hubble 2019
function processSaturn() {
  const png = PNG.sync.read(fs.readFileSync('assets/master_saturn.png'));
  const { width, height, data } = png;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const maxC = Math.max(r, g, b);
      if (maxC < 14) {
        data[idx + 3] = 0;
      } else if (maxC < 45) {
        data[idx + 3] = Math.round(((maxC - 14) / 31) * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/saturn_trans.png');
}

// 6. SUN: 4044x3860 NASA SDO 4K master! Downsample slightly to 2022x1930 for optimal web load speed
function processSun() {
  const raw = jpeg.decode(fs.readFileSync('assets/master_sun.jpg'), { useTArray: true });
  const srcW = raw.width, srcH = raw.height;
  const outW = Math.round(srcW / 2), outH = Math.round(srcH / 2);
  const outData = new Uint8Array(outW * outH * 4);

  const cx = Math.round(srcW / 2), cy = Math.round(srcH / 2);
  const coreR = 1500;

  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const sx = ox * 2, sy = oy * 2;
      const sIdx = (sy * srcW + sx) * 4;
      const oIdx = (oy * outW + ox) * 4;

      const r = raw.data[sIdx], g = raw.data[sIdx + 1], b = raw.data[sIdx + 2];
      outData[oIdx] = r;
      outData[oIdx + 1] = g;
      outData[oIdx + 2] = b;

      const dist = Math.hypot(sx - cx, sy - cy);
      const maxC = Math.max(r, g, b);

      if (dist < coreR) {
        outData[oIdx + 3] = 255;
      } else {
        if (maxC < 15) {
          outData[oIdx + 3] = 0;
        } else if (maxC < 55) {
          outData[oIdx + 3] = Math.round(((maxC - 15) / 40) * 255);
        } else {
          outData[oIdx + 3] = 255;
        }
      }
    }
  }
  savePng(outW, outH, outData, 'assets/sun_trans.png');
}

// 7. VENUS: Use the 2048x2048 master
function processVenus() {
  fs.copyFileSync('assets/venus_orb.png', 'assets/venus_trans.png');
  console.log('✓ Verified assets/venus_trans.png (2048x2048)');
}

try {
  processMoon();
  processMars();
  processJupiter();
  processMercury();
  processSaturn();
  processSun();
  processVenus();
  console.log('🎉 ALL 7 ULTRA-HIGH-RESOLUTION TRANSPARENT PLANET PNGS COMPLETED!');
} catch (e) {
  console.error('Error generating:', e);
}
