const https = require('https');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

const VERSION = '2.30.1';
const ASSET_NAME = `tiledb-macos-arm64-${VERSION}-6ea48ca.tar.gz`;
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
    
    const crypto = require('crypto');
    const EXPECTED_HASH = "4cd77199489648bcd45a7a59aaf0543f7aa3f18876c1466dd36cfe0ebabaad27";
    const tempFilePath = path.join(__dirname, 'temp.tar.gz');
    const fileStream = fs.createWriteStream(tempFilePath);
    const hash = crypto.createHash('sha256');
    
    res.pipe(fileStream);
    res.on('data', chunk => hash.update(chunk));
    
    res.on('end', () => {
      const digest = hash.digest('hex');
      if (digest !== EXPECTED_HASH) {
        fs.unlinkSync(tempFilePath);
        console.error('Checksum mismatch! Possible MITM or tampered binary.');
        process.exit(1);
      }
      
      const readStream = fs.createReadStream(tempFilePath);
      readStream.pipe(tar.x({
        C: DEST_DIR,
        strip: 1
      }))
      .on('finish', () => {
        console.log('Extraction complete.');
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
      })
      .on('error', (err) => {
        console.error('Extraction error:', err);
        process.exit(1);
      });
    });
  }
}).on('error', (err) => {
  console.error('Download error:', err);
  process.exit(1);
});
