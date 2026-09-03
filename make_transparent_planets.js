const fs = require('fs');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

console.log('--- GENERATING TRANSPARENT PLANET PNGS ---');

// Helper to save PNG
function savePng(width, height, rgbaBuffer, destPath) {
  const png = new PNG({ width, height });
  png.data = rgbaBuffer;
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(destPath, buffer);
  console.log(`✓ Saved ${destPath} (${width}x${height}, ${(buffer.length/1024).toFixed(1)} KB)`);
}

// 1. MOON: Spherical cut with 4px antialiasing
function processMoon() {
  const jpgData = fs.readFileSync('assets/moon.jpg');
  const raw = jpeg.decode(jpgData, { useTArray: true });
  const { width, height, data } = raw;
  const cx = 512, cy = 512, r = 494;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r) {
        data[idx + 3] = 0;
      } else if (dist > r - 4) {
        const factor = (r - dist) / 4;
        data[idx + 3] = Math.round(factor * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/moon_trans.png');
}

// 2. MERCURY: Spherical cut with 4px antialiasing
function processMercury() {
  const jpgData = fs.readFileSync('assets/mercury.jpg');
  const raw = jpeg.decode(jpgData, { useTArray: true });
  const { width, height, data } = raw;
  const cx = 512, cy = 512, r = 448;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r) {
        data[idx + 3] = 0;
      } else if (dist > r - 4) {
        const factor = (r - dist) / 4;
        data[idx + 3] = Math.round(factor * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/mercury_trans.png');
}

// 3. JUPITER: Spherical cut with 4px antialiasing
function processJupiter() {
  const jpgData = fs.readFileSync('assets/jupiter.jpg');
  const raw = jpeg.decode(jpgData, { useTArray: true });
  const { width, height, data } = raw;
  const cx = 512, cy = 512, r = 486;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r) {
        data[idx + 3] = 0;
      } else if (dist > r - 4) {
        const factor = (r - dist) / 4;
        data[idx + 3] = Math.round(factor * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/jupiter_trans.png');
}

// 4. THE SUN: Luminance-based alpha with feathered corona
function processSun() {
  const jpgData = fs.readFileSync('assets/sun.jpg');
  const raw = jpeg.decode(jpgData, { useTArray: true });
  const { width, height, data } = raw;
  const cx = 512, cy = 512, coreR = 380;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const maxC = Math.max(r, g, b);

      if (dist < coreR) {
        data[idx + 3] = 255;
      } else {
        if (maxC < 14) {
          data[idx + 3] = 0;
        } else if (maxC < 55) {
          data[idx + 3] = Math.round(((maxC - 14) / 41) * 255);
        } else {
          data[idx + 3] = 255;
        }
      }
    }
  }
  savePng(width, height, data, 'assets/sun_trans.png');
}

// 5. SATURN: Luminance thresholding to preserve rings + globe with soft edges
function processSaturn() {
  const jpgData = fs.readFileSync('assets/saturn.jpg');
  const raw = jpeg.decode(jpgData, { useTArray: true });
  const { width, height, data } = raw;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const maxC = Math.max(r, g, b);

      if (maxC < 10) {
        data[idx + 3] = 0;
      } else if (maxC < 40) {
        data[idx + 3] = Math.round(((maxC - 10) / 30) * 255);
      } else {
        data[idx + 3] = 255;
      }
    }
  }
  savePng(width, height, data, 'assets/saturn_trans.png');
}

// 6. VENUS & MARS: Copy from transparent orbs
function processVenusMars() {
  fs.copyFileSync('assets/venus_orb.png', 'assets/venus_trans.png');
  console.log('✓ Copied assets/venus_trans.png from venus_orb.png');
  fs.copyFileSync('assets/mars_orb.png', 'assets/mars_trans.png');
  console.log('✓ Copied assets/mars_trans.png from mars_orb.png');
}

try {
  processMoon();
  processMercury();
  processJupiter();
  processSun();
  processSaturn();
  processVenusMars();
  console.log('🎉 ALL 7 PLANET TRANSPARENT PNGS CREATED SUCCESSFULLY!');
} catch (e) {
  console.error('Error processing:', e);
}
