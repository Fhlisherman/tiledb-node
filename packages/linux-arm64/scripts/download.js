const https = require('https');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

const VERSION = '2.30.1';
const ASSET_NAME = `tiledb-linux-arm64-${VERSION}-6ea48ca.tar.gz`;
const URL = `https://github.com/TileDB-Inc/TileDB/releases/download/${VERSION}/${ASSET_NAME}`;

const DEST_DIR = path.join(__dirname, '..', 'tiledb-dist');

if (fs.existsSync(DEST_DIR)) {
  console.log('TileDB binaries already downloaded.');
  process.exit(0);
}

fs.mkdirSync(DEST_DIR, { recursive: true });

console.log(`Downloading TileDB from ${URL}...`);

https.get(URL, (response) => {
  if (response.statusCode === 301 || response.statusCode === 302) {
    const redirectUrl = response.headers.location;
    if (!redirectUrl.startsWith('https://github.com/') && !redirectUrl.startsWith('https://objects.githubusercontent.com/')) {
      throw new Error(`Insecure redirect rejected: ${redirectUrl}`);
    }
    return https.get(redirectUrl, processDownload);
  }
  processDownload(response);
  
  function processDownload(res) {
    if (res.statusCode !== 200) {
      console.error(`Failed to download: ${res.statusCode}`);
      process.exit(1);
    }
    
    res.pipe(tar.x({
      C: DEST_DIR,
      strip: 1
    }))
    .on('finish', () => {
      console.log('Extraction complete.');
    })
    .on('error', (err) => {
      console.error('Extraction error:', err);
      process.exit(1);
    });
  }
}).on('error', (err) => {
  console.error('Download error:', err);
  process.exit(1);
});
