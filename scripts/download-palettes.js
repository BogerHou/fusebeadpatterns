const fs = require('fs');
const https = require('https');
const path = require('path');

const palettes = [
  'hama', 'hama_mini', 'hama_maxi', 'nabbi', 'mard',
  'artkal_a', 'artkal_c', 'artkal_m', 'artkal_r', 'artkal_s',
  'perler', 'perler_mini', 'perler_caps', 'yant', 'diamondDotz'
];

const targetDir = path.join(__dirname, '../public/palettes');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

palettes.forEach(palette => {
  const url = `https://beadcolors.eremes.xyz/gen/v3/${palette}.csv`;
  const dest = path.join(targetDir, `${palette}.csv`);
  
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to download ${palette}: ${res.statusCode}`);
      return;
    }
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${palette}.csv`);
    });
  }).on('error', (err) => {
    console.error(`Error downloading ${palette}: ${err.message}`);
  });
});
