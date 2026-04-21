const https = require('https');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

const VERSION = '2.30.1';
const ASSET_NAME = `tiledb-windows-x86_64-${VERSION}-6ea48ca.zip`;
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
    const EXPECTED_HASH = "6a997bd1ec3dd52569da704ce0ceac4e4b547a603feb5edb41617b5b9c4909bb";
    const tempFilePath = path.join(__dirname, 'temp.zip');
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
      readStream.pipe(unzipper.Parse())
      .on('entry', function (entry) {
        const fileName = entry.path.replace(/\\/g, '/');
        const firstSlash = fileName.indexOf('/');
        
        if (firstSlash === -1) {
          entry.autodrain();
          return;
        }
        
        const strippedPath = fileName.substring(firstSlash + 1);
        if (!strippedPath) {
          entry.autodrain();
          return;
        }
        
        const fullPath = path.resolve(DEST_DIR, strippedPath);
        if (fullPath.indexOf(path.resolve(DEST_DIR) + path.sep) !== 0) {
          entry.autodrain();
          throw new Error(`Zip Slip Detected: ${fullPath}`);
        }
        if (entry.type === 'Directory') {
          fs.mkdirSync(fullPath, { recursive: true });
          entry.autodrain();
        } else {
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          entry.pipe(fs.createWriteStream(fullPath));
        }
      })
      .on('close', () => {
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
