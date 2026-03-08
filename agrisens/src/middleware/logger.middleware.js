const logsService = require('../modules/logs/logs.service');
const logger      = require('../utils/logger');

/**
 * Middleware qui logue automatiquement chaque requête API dans logs_systeme
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const niveau   = res.statusCode >= 500 ? 'error'
                   : res.statusCode >= 400 ? 'warning'
                   : 'info';

    // Ne pas logger les health checks ni les assets
    if (req.path === '/health' || req.path.includes('favicon')) return;

    try {
      await logsService.createLog({
        service:   'api',
        niveau,
        message:   `${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`,
        context:   {
          method:     req.method,
          path:       req.path,
          statusCode: res.statusCode,
          duration,
          userAgent:  req.headers['user-agent'],
          query:      Object.keys(req.query).length ? req.query : undefined,
        },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userId:    req.user?.id || null,
      });
    } catch (err) {
      logger.error('Erreur logging requête :', err.message);
    }
  });

  next();
}

/**
 * Middleware de gestion d'erreurs avec logging
 */
function errorLogger(err, req, res, next) {
  logger.error(`${req.method} ${req.path} → ${err.message}`);

  logsService.createLog({
    service:   'api',
    niveau:    'error',
    message:   err.message,
    stack:     err.stack,
    context:   { method: req.method, path: req.path, statusCode: err.status || 500 },
    ipAddress: req.ip,
    userId:    req.user?.id || null,
  }).catch(() => {});

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { requestLogger, errorLogger };
