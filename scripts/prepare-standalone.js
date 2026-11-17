const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.log('No standalone directory found, skipping.');
  process.exit(0);
}

// 1. Copy public directory
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');
if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
  console.log('✓ Copied public to .next/standalone/public');
}

// 2. Copy static directory
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
  console.log('✓ Copied .next/static to .next/standalone/.next/static');
}

// 3. Copy .prisma generated client files
const prismaSrc = path.join(rootDir, 'node_modules', '.prisma');
const prismaDest = path.join(standaloneDir, 'node_modules', '.prisma');
if (fs.existsSync(prismaSrc)) {
  fs.cpSync(prismaSrc, prismaDest, { recursive: true, force: true });
  console.log('✓ Copied node_modules/.prisma to .next/standalone/node_modules/.prisma');
}

// 4. Copy root .env if it exists
const envSrc = path.join(rootDir, '.env');
const envDest = path.join(standaloneDir, '.env');
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, envDest);
  console.log('✓ Copied .env to .next/standalone/.env');
}

// 5. Generate dedicated Passenger-compatible server.js
const serverJsContent = `// Phusion Passenger / Hostinger production server for Tangaly Next.js
const path = require('path');
const http = require('http');
const fs = require('fs');

process.env.NODE_ENV = 'production';
process.chdir(__dirname);

// Load .env variables into process.env if present
const dotenvPath = path.join(__dirname, '.env');
if (fs.existsSync(dotenvPath)) {
  try {
    const envContent = fs.readFileSync(dotenvPath, 'utf8');
    envContent.split('\\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  } catch (e) {
    console.error('Failed reading .env:', e);
  }
}

const NextServer = require('next/dist/server/next-server').default;
const nextConfig = require('./.next/required-server-files.json').config;
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const app = new NextServer({
  hostname: '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  dir: __dirname,
  dev: false,
  customServer: false,
  conf: nextConfig,
});

const handler = app.getRequestHandler();

const server = http.createServer(async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error('Error handling request:', req.url, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.once('error', (err) => {
  console.error('Server error on listen:', err);
  process.exit(1);
});

// Under Phusion Passenger, process.env.PORT is either a socket path, 'passenger', or a port
const listenTarget = process.env.PORT || 3000;
server.listen(listenTarget, () => {
  console.log(\`> Tangaly Next.js Server Ready on \${listenTarget}\`);
});
`;

fs.writeFileSync(path.join(standaloneDir, 'server.js'), serverJsContent, 'utf8');
fs.writeFileSync(path.join(rootDir, 'server.js'), serverJsContent, 'utf8');
console.log('✓ Successfully wrote Passenger-compatible server.js to both root and standalone');
