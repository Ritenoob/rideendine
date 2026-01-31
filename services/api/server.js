const http = require('http');

const PORT = process.env.PORT || 9001;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET' && req.url === '/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, service: 'api' }));
    return;
  }

  if (req.method === 'GET' && req.url === '/me') {
    res.statusCode = 200;
    res.end(JSON.stringify({ role: 'dispatch', userId: 'demo' }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`API service running on http://localhost:${PORT}`);
});
