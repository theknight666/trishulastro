const https = require('https');
const fs = require('fs');

const sources = {
  'master_sun.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  'master_moon.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg',
  'master_mercury.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/30/Mercury_in_color_-_Prockter07_centered.jpg',
  'master_saturn.png': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Saturn_2019.png',
  'master_mars.jpg': 'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg'
};

function download(name, url) {
  return new Promise((resolve, reject) => {
    const dest = 'assets/' + name;
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': 'TrishulAstro/1.0 (astro@trishulastro.com)' } }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(dest);
        console.log(`✓ Downloaded ${name} (${(stat.size/1024/1024).toFixed(2)} MB)`);
        resolve();
      });
    });
    req.on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const [name, url] of Object.entries(sources)) {
    try {
      await download(name, url);
    } catch (e) {
      console.error(e.message);
    }
  }
}
run();
