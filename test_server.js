import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 简单轻量的 HTTP 静态文件服务器
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

export function startServer(port = 8099) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (reqPath === '/') reqPath = '/index.html';

    // 去除开头的斜杠以保证 path.resolve 正确结合 __dirname
    const cleanPath = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
    const filePath = path.resolve(__dirname, cleanPath);
    console.log(`[HTTP Request] ${req.url} -> ${filePath} (exists: ${fs.existsSync(filePath)})`);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[TestServer] Running at http://localhost:${port}`);
      resolve(server);
    });
  });
}
