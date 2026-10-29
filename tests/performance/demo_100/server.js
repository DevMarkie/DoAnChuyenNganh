/**
 * HTTP Server phục vụ Visual Dashboard cho Demo 100 User Đăng Ký Môn
 * Cổng: 5050 (http://localhost:5050)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { runConcurrencyDemo, RESULT_FILE } = require('./run_concurrency_test');

const PORT = process.env.PORT || 5050;
const PUBLIC_DIR = path.join(__dirname, 'public');

let isRunningTest = false;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. API: Lấy kết quả mới nhất
  if (req.method === 'GET' && pathname === '/api/latest-result') {
    if (fs.existsSync(RESULT_FILE)) {
      const data = fs.readFileSync(RESULT_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(data);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Chưa có kết quả test nào' }));
    }
  }

  // 2. API: Chạy bài test tải trực tiếp
  if (req.method === 'POST' && pathname === '/api/run-test') {
    if (isRunningTest) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Một bài test khác đang chạy, vui lòng đợi giây lát' }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        isRunningTest = true;
        let options = {};
        try { options = JSON.parse(body); } catch {}
        
        const capacity = Number(options.capacity || 40);
        const totalUsers = Number(options.totalUsers || 100);

        console.log(`[API /api/run-test] Nhận yêu cầu chạy tải: ${totalUsers} users, ${capacity} slots`);
        const result = await runConcurrencyDemo({ capacity, totalUsers });
        
        isRunningTest = false;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (err) {
        isRunningTest = false;
        console.error('[API /api/run-test] Lỗi khi chạy test:', err);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 3. API: Kiểm tra trạng thái hệ thống
  if (req.method === 'GET' && pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      status: 'ONLINE',
      isRunningTest,
      timestamp: new Date().toISOString()
    }));
  }

  // 4. Phục vụ Static Files (public/index.html)
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.js') contentType = 'application/javascript';
  else if (ext === '.css') contentType = 'text/css';
  else if (ext === '.json') contentType = 'application/json';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`======================================================================`);
  console.log(`🚀 DEMO DASHBOARD ĐANG CHẠY TẠI: http://localhost:${PORT}`);
  console.log(`======================================================================`);
});

module.exports = { server };

