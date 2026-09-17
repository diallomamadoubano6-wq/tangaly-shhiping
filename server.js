const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
// Hostinger / Phusion Passenger can pass a numeric port or a unix socket path
const port = process.env.PORT || 3000;

console.log(`[Tangaly] Starting server in ${dev ? 'development' : 'production'} mode...`);
console.log(`[Tangaly] Target port/socket: ${port}`);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('[Tangaly] Error occurred handling request:', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    server.once('error', (err) => {
      console.error('[Tangaly] Server startup error:', err);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`[Tangaly] Ready and listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error('[Tangaly] Fatal error during Next.js app.prepare():', err);
    process.exit(1);
  });

