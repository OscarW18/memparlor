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

// Dev-only: persist a fold's image crop (media.position / media.zoom) so the
// ?dev focal-point picker can "Save" straight to content/<fold>.json instead of
// the user copy-pasting. Dev convenience only — there is no such endpoint on the
// deployed static site, where the picker doesn't run anyway.
function saveCrop(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e5) req.destroy(); // guard against runaway payloads
  });
  req.on('end', () => {
    try {
      const { fold, position, zoom } = JSON.parse(body || '{}');
      // fold names map to content/<fold>.json — restrict the charset so this can
      // never escape the content dir.
      if (typeof fold !== 'string' || !/^[a-z][a-z0-9-]*$/.test(fold)) {
        return send(res, 400, 'invalid fold');
      }
      const file = path.join(ROOT, 'content', `${fold}.json`);
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      json.media = json.media || {};
      if (typeof position === 'string' && /^[\d%.\s a-z-]+$/i.test(position)) {
        json.media.position = position;
      }
      if (typeof zoom === 'number' && Number.isFinite(zoom)) {
        json.media.zoom = zoom;
      }
      fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
      send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
    } catch (err) {
      send(res, 400, `save failed: ${err.message}`);
    }
  });
}

const server = http.createServer((req, res) => {
  // Decode + strip query, then resolve safely inside ROOT (no path traversal).
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (req.method === 'POST' && urlPath === '/__dev/crop') return saveCrop(req, res);

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
