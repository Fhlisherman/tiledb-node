const https = require('https');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

// Platform guard — skip download on wrong platform
if (process.platform !== 'win32' || process.arch !== 'x64') {
  console.log('Skipping download: wrong platform (expected win32-x64)');
  process.exit(0);
}

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
const EXPECTED_HASH = "6a997bd1ec3dd52569da704ce0ceac4e4b547a603feb5edb41617b5b9c4909bb";

secureGet(URL).then((res) => {
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
}).catch((err) => {
  console.error('Download error:', err);
  process.exit(1);
});
