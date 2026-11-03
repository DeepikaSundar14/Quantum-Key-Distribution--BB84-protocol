const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  fs.readFile(HTML_FILE, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading dashboard: ' + err.message);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`\n⚛️  QKD Interactive Lab running at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop.\n`);
});

