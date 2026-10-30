import { createMissileService } from './missile.js';
import { createAnalysisService } from './analysis.js';
import http from 'node:http';
import { createNewsService } from './service.js';
const service = createNewsService({ env: process.env, file: new URL('../data/news.json', import.meta.url) });
const analysisService = createAnalysisService({ env: process.env, file: new URL('../data/analysis.json', import.meta.url) });
const missileService = createMissileService({ env: process.env, file: new URL('../data/missile.json', import.meta.url) });
const origins = new Set((process.env.CORS_ORIGINS || 'http://localhost:8082,http://localhost:8081').split(',').map(s => s.trim()));
const limits = new Map();
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.headers.origin) {
    if (!origins.has(req.headers.origin)) { res.writeHead(403); return res.end(JSON.stringify({ error: 'ORIGIN_DENIED' })); }
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin); res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); res.writeHead(204); return res.end(); }
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET, OPTIONS'); res.writeHead(405); return res.end('{}'); }
  const ip = req.socket.remoteAddress, now = Date.now();
  let limit = limits.get(ip); if (!limit || now > limit.reset) { limit = { count: 0, reset: now + 60000 }; limits.set(ip, limit); }
  if (++limit.count > 120) { res.setHeader('Retry-After', '60'); res.writeHead(429); return res.end(JSON.stringify({ error: 'RATE_LIMITED' })); }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/api/alerts') return res.end(JSON.stringify(missileService.read()));
  if (path === '/health') return res.end(JSON.stringify({ status: 'ok' }));
  if (path === '/api/analysis') { const data = analysisService.read(); res.writeHead(data.analysis ? 200 : 503); return res.end(JSON.stringify(data)); }
  if (path === '/api/news') {
    const data = service.read();
    res.writeHead(data.updatedAt ? 200 : 503);
    return res.end(JSON.stringify(data));
  }
  res.writeHead(404); res.end(JSON.stringify({ error: 'NOT_FOUND' }));
});
await service.load(); await analysisService.load(); await missileService.load();
server.listen(Number(process.env.PORT) || 3001, process.env.HOST || '0.0.0.0');
void service.refresh(); void analysisService.refresh(); void missileService.refresh();
const timer = setInterval(() => { for (const [ip, value] of limits) if (Date.now() > value.reset) limits.delete(ip); void service.refresh(); void analysisService.refresh(); void missileService.refresh(); }, 60000);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { clearInterval(timer); server.close(() => process.exit(0)); });
