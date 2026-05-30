'use strict';

const crypto = require('crypto');
const promClient = require('prom-client');

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

const register = new promClient.Registry();

register.setDefaultLabels({
  app: process.env.APP_NAME || 'unknown',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',
});

promClient.collectDefaultMetrics({ register, prefix: 'nodejs_' });

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Metrics
// ─────────────────────────────────────────────────────────────────────────────

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsInFlight = new promClient.Gauge({
  name: 'http_requests_in_flight',
  help: 'Currently active HTTP requests',
  registers: [register],
});
httpRequestsInFlight.set(0);

// ─────────────────────────────────────────────────────────────────────────────
// Application Health
// ─────────────────────────────────────────────────────────────────────────────

const appReady = new promClient.Gauge({
  name: 'application_ready',
  help: 'Application readiness status (1 = ready, 0 = not ready)',
  registers: [register],
});
appReady.set(1);

// ─────────────────────────────────────────────────────────────────────────────
// Middleware — tracks all non-metrics requests
// ─────────────────────────────────────────────────────────────────────────────

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') return next();

  const start = Date.now();
  httpRequestsInFlight.inc();

  res.on('finish', () => {
    const route = (req.route && req.route.path) ? req.route.path : req.path;
    const labels = { method: req.method, route, status: res.statusCode };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, (Date.now() - start) / 1000);
    httpRequestsInFlight.dec();
  });

  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth guard — requires Authorization: Bearer <METRICS_TOKEN>
// ─────────────────────────────────────────────────────────────────────────────

function metricsAuthMiddleware(req, res, next) {
  const token = process.env.METRICS_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'Metrics endpoint disabled: METRICS_TOKEN not configured' });
  }

  const authHeader = req.headers['authorization'] || '';
  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  try {
    const tokenBuf = Buffer.from(token);
    const providedBuf = Buffer.alloc(tokenBuf.length);
    Buffer.from(provided).copy(providedBuf);
    const valid = crypto.timingSafeEqual(tokenBuf, providedBuf) && provided.length === token.length;
    if (!valid) throw new Error();
  } catch {
    res.set('WWW-Authenticate', 'Bearer realm="metrics"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

module.exports = { register, metricsMiddleware, metricsAuthMiddleware, metricsHandler, appReady };
