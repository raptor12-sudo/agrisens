const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');

const { requestLogger, errorLogger } = require('./middleware/logger.middleware');
const { router: sseRouter, broadcast } = require('./modules/sse/sse.routes');

// Injecter broadcast dans capteurs.service
const capteursService = require('./modules/capteurs/capteurs.service');
capteursService.setBroadcast(broadcast);

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use((req, res, next) => next()); // rate limit désactivé en dev

app.use(requestLogger);

app.use('/api/auth',          require('./modules/auth/auth.routes'));
app.use('/api/fermes',        require('./modules/fermes/fermes.routes'));
app.use('/api/parcelles',     require('./modules/parcelles/parcelles.routes'));
app.use('/api/gateways',      require('./modules/gateways/gateways.routes'));
app.use('/api/devices',       require('./modules/devices/devices.routes'));
app.use('/api/capteurs',      require('./modules/capteurs/capteurs.routes'));
app.use('/api/alertes',       require('./modules/alertes/alertes.routes'));
app.use('/api/users',         require('./modules/users/users.routes'));
app.use('/api/ingest', require('./modules/ingest/ingest.routes'));
app.use('/api/logs',          require('./modules/logs/logs.routes'));
app.use('/api/sse',           sseRouter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorLogger);

module.exports = app;
