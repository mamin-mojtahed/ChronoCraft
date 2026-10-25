import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../out');

// Base path matches GitHub Pages repo subpath or can be overridden
const basePath = process.env.NEXT_PUBLIC_BASE_PATH !== undefined 
  ? process.env.NEXT_PUBLIC_BASE_PATH 
  : '/ChronoCraft';

const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=UTF-8',
};

if (!fs.existsSync(outDir)) {
  console.error(`\n❌ Error: Output directory "${outDir}" does not exist. Run "npm run build" first.\n`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // If basePath is configured and request is to root, redirect to basePath
  if (basePath && (urlPath === '/' || urlPath === '')) {
    res.writeHead(302, { Location: `${basePath}/` });
    return res.end();
  }

  // Strip basePath prefix if present
  if (basePath) {
    if (urlPath === basePath) {
      res.writeHead(302, { Location: `${basePath}/` });
      return res.end();
    }
    if (urlPath.startsWith(`${basePath}/`)) {
      urlPath = urlPath.slice(basePath.length);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end(`404: Not Found (Route not under basePath "${basePath}")`);
    }
  }

  if (urlPath === '' || urlPath === '/') {
    urlPath = '/index.html';
  }

  let filePath = path.join(outDir, urlPath);

  // If directory, look for index.html (trailingSlash: true output)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file does not exist, try with .html extension
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // If still not found, fallback to 404.html
  if (!fs.existsSync(filePath)) {
    const notFoundPage = path.join(outDir, '404.html');
    if (fs.existsSync(notFoundPage)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      return fs.createReadStream(notFoundPage).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('404 Not Found');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  const url = `http://localhost:${port}${basePath ? `${basePath}/` : '/'}`;
  console.log(`\n======================================================`);
  console.log(`✨ ChronoCraft Static Export Preview Server`);
  console.log(`📁 Serving directory: ${outDir}`);
  console.log(`🌐 Base Path: ${basePath || '(none - root)'}`);
  console.log(`🚀 Preview URL: ${url}`);
  console.log(`======================================================\n`);
});
