const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 9002;

function haversine(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function scoreDriver(driver, cook, reliabilityScores) {
  const distance = haversine(driver, cook);
  const reliability = reliabilityScores?.[driver.id] ?? 50;
  return reliability - distance * 8;
}

function assignDrivers(payload) {
  const orders = payload.orders || [];
  const drivers = payload.drivers || [];
  const cooks = payload.cooks || [];
  const scores = payload.driverScores || {};
  const assignments = [];

  orders.forEach((order) => {
    const cook = cooks.find((c) => c.id === order.cookId);
    if (!cook) return;
    let best = null;
    let bestScore = -Infinity;
    drivers.forEach((driver) => {
      const score = scoreDriver(driver, cook, scores);
      if (score > bestScore) {
        bestScore = score;
        best = driver;
      }
    });
    if (best) {
      assignments.push({ orderId: order.id, driverId: best.id, score: bestScore });
    }
  });

  return assignments;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, service: 'dispatch' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/assign') {
    try {
      const payload = await readJson(req);
      const assignments = assignDrivers(payload);
      res.statusCode = 200;
      res.end(JSON.stringify({ assignments }));
    } catch (err) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'invalid payload' }));
    }
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/healthz')) {
    const url = new URL(req.url, 'http://localhost');
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, query: Object.fromEntries(url.searchParams) }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`Dispatch service running on http://localhost:${PORT}`);
});
