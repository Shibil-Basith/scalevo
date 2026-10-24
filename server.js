const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': type.includes('text/html') ? 'no-cache' : 'public, max-age=0',
  });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) return send(res, 404, 'Not found');
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': type.includes('text/html') ? 'no-cache' : 'public, max-age=0' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/api/health') {
    return send(res, 200, JSON.stringify({ ok: true, service: 'scalevo-learning-workspace', timestamp: new Date().toISOString() }), 'application/json; charset=utf-8');
  }

  if (pathname === '/api/catalog') {
    return serveFile(res, path.join(PUBLIC_DIR, 'catalog.json'));
  }

  if (pathname === '/api/session') {
    return send(res, 200, JSON.stringify({ user: { name: 'Aarav Menon', role: 'learner', batch: 'Platform Engineering · 2026' } }), 'application/json; charset=utf-8');
  }

  if (pathname.startsWith('/api/')) {
    return send(res, 404, JSON.stringify({ error: 'API route not found' }), 'application/json; charset=utf-8');
  }

  const requested = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(requested).replace(/^\.{2}[\\/]/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (filePath.startsWith(PUBLIC_DIR) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  return serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scalevo listening on http://0.0.0.0:${PORT}`);
});
