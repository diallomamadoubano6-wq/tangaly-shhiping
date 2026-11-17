// Custom Next.js server for Phusion Passenger / Hostinger deployment
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Under Phusion Passenger, PORT is either a socket path or 'passenger' or a port
  const listenTarget = process.env.PORT || 3000;
  server.listen(listenTarget, () => {
    console.log(`> Next.js Server Ready on ${listenTarget}`);
  });
}).catch((err) => {
  console.error('Next.js failed to prepare:', err);
  process.exit(1);
});
