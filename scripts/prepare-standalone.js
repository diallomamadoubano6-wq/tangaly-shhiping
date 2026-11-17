const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
if (!fs.existsSync(standaloneDir)) {
  console.log('No standalone directory found, skipping.');
  process.exit(0);
}

// 1. Copy public directory
const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(standaloneDir, 'public');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
  console.log('✓ Copied public to .next/standalone/public');
}

// 2. Copy static directory
const staticSrc = path.join(__dirname, '..', '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
  console.log('✓ Copied .next/static to .next/standalone/.next/static');
}

// 3. Patch server.js to support Phusion Passenger sockets
const serverJsPath = path.join(standaloneDir, 'server.js');
if (fs.existsSync(serverJsPath)) {
  let content = fs.readFileSync(serverJsPath, 'utf8');
  content = content.replace(
    'const currentPort = parseInt(process.env.PORT, 10) || 3000',
    `const currentPort = process.env.PORT && isNaN(Number(process.env.PORT)) ? process.env.PORT : (parseInt(process.env.PORT, 10) || 3000)`
  );
  fs.writeFileSync(serverJsPath, content, 'utf8');
  console.log('✓ Patched .next/standalone/server.js for Phusion Passenger compatibility');
}
