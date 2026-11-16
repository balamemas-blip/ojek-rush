// Ojek Rush — tiny local dev server: serves game/ at http://localhost:8080
// so the game can be played and screenshotted in a desktop browser.
// Run: node serve.ts   (from this directory)

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = join(root, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': types[extname(filePath)] ?? 'application/octet-stream',
    // Never cache while screenshotting: the browser must show the latest build.
    'cache-control': 'no-store',
  });
  res.end(readFileSync(filePath));
});

server.listen(8080, () => {
  console.log('Ojek Rush at http://localhost:8080');
});
