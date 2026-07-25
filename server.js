const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = { '.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp' };
http.createServer((req, res) => {
  let f = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const p = path.resolve(__dirname, '.' + f);
  if (!p.startsWith(path.resolve(__dirname))) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://raw.githubusercontent.com https://avatars.githubusercontent.com; connect-src 'self' https://api.github.com https://cdn.jsdelivr.net");
  try {
    const c = fs.readFileSync(p);
    const ext = path.extname(p);
    let ct = mime[ext] || 'application/octet-stream';
    if (ct.startsWith('text/') || ct === 'application/javascript') ct += '; charset=utf-8';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(c);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(8000, () => console.log('Server running at http://localhost:8000'));
