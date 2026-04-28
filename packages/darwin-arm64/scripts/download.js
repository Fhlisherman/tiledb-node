const https = require('https');
const fs = require('fs');
const path = require('path');
const tar = require('tar');

// Platform guard — skip download on wrong platform
if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  console.log('Skipping download: wrong platform (expected darwin-arm64)');
  process.exit(0);
}

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

/**
 * Follows HTTPS redirects securely up to maxRedirects.
 * Only allows redirects to github.com and objects.githubusercontent.com.
 */
function secureGet(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && maxRedirects > 0) {
        const loc = res.headers.location;
        if (!loc || (!loc.startsWith('https://github.com/') && !loc.startsWith('https://objects.githubusercontent.com/'))) {
          return reject(new Error(`Insecure redirect rejected: ${loc}`));
        }
        res.resume(); // drain the response
        return resolve(secureGet(loc, maxRedirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
      }
      resolve(res);
    }).on('error', reject);
  });
}

const crypto = require('crypto');
const EXPECTED_HASH = "4cd77199489648bcd45a7a59aaf0543f7aa3f18876c1466dd36cfe0ebabaad27";

secureGet(URL).then((res) => {
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
}).catch((err) => {
  console.error('Download error:', err);
  process.exit(1);
});
