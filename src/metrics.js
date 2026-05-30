const promClient = require('prom-client');

const register = new promClient.Registry();

// ─────────────────────────────────────────────────────────────────────────────
// Default Labels
// ─────────────────────────────────────────────────────────────────────────────

register.setDefaultLabels({
  app: process.env.APP_NAME || 'unknown',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '0.0.0',
});

// ─────────────────────────────────────────────────────────────────────────────
// Node.js Runtime Metrics
// ─────────────────────────────────────────────────────────────────────────────

promClient.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
});

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
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestsInFlight = new promClient.Gauge({
  name: 'http_requests_in_flight',
  help: 'Currently active HTTP requests',
  labelNames: ['method'],
  registers: [register],
});

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
// Express Middleware
// ─────────────────────────────────────────────────────────────────────────────

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();

  httpRequestsInFlight.inc({
    method: req.method,
  });

  res.on('finish', () => {
    const route = req.route?.path || req.path;

    const labels = {
      method: req.method,
      route,
      status: res.statusCode,
    };

    httpRequestsTotal.inc(labels);

    httpRequestDuration.observe(
      labels,
      (Date.now() - start) / 1000
    );

    httpRequestsInFlight.dec({
      method: req.method,
    });
  });

  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Metrics Endpoint
// ─────────────────────────────────────────────────────────────────────────────

async function metricsHandler(req, res) {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  appReady,
};
