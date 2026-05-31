#!/usr/bin/env node
/* ==========================================================================
   Minimal static dev server (Node built-ins only — no dependencies).
   Serves the project root and falls back to index.html for clean-path routes
   (e.g. /about-us) so deep links work. Mirrors what the Worker/SSR pass will
   do later; not a production server.
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, 'Internal Server Error');
    send(res, 200, data, MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  });
}

const server = http.createServer((req, res) => {
  // Decode + strip query, then resolve safely inside ROOT (no path traversal).
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const resolved = path.normalize(path.join(ROOT, urlPath));
  // Guard against path traversal. A bare startsWith(ROOT) would also pass for a
  // sibling dir sharing the prefix (e.g. <root>-private), so require the path to
  // be ROOT itself or sit under ROOT + separator.
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(resolved, (err, stats) => {
    if (!err && stats.isFile()) return serveFile(res, resolved);
    if (!err && stats.isDirectory()) return serveFile(res, path.join(resolved, 'index.html'));

    // No file at this path. If it looks like a clean route (no file extension),
    // fall back to index.html so the client router can handle it.
    if (!path.extname(urlPath)) return serveFile(res, path.join(ROOT, 'index.html'));

    send(res, 404, 'Not Found');
  });
});

// Try the requested port; if it's busy, walk up to the next few free ones so a
// stray process on 8080 doesn't block `npm run dev`. Set PORT to pin it.
const MAX_PORT_TRIES = 10;

server.on('listening', () => {
  console.log(`Memory Parlour dev server → http://localhost:${server.address().port}`);
});

function listen(port, triesLeft) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && triesLeft > 0) {
      console.warn(`Port ${port} is in use, trying ${port + 1}…`);
      listen(port + 1, triesLeft - 1);
    } else {
      console.error(err.message);
      process.exit(1);
    }
  });
  server.listen(port);
}

listen(Number(PORT), MAX_PORT_TRIES);
