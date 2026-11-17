// Phusion Passenger / Hostinger production server for Tangaly Next.js
if (typeof(PhusionPassenger) !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

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
    envContent.split('\n').forEach(line => {
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

// Under Phusion Passenger, explicitly listen on 'passenger'
const listenTarget = (typeof(PhusionPassenger) !== 'undefined') ? 'passenger' : (process.env.PORT || 3000);
server.listen(listenTarget, () => {
  console.log(`> Tangaly Next.js Server Ready on ${listenTarget}`);
});
