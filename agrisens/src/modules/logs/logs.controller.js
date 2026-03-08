const service = require('./logs.service');

async function getLogs(req, res, next) {
  try {
    const { service: svc, niveau, from, to, limit, offset } = req.query;
    const logs = await service.getLogs({ service: svc, niveau, from, to, limit, offset });
    res.json(logs);
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const stats = await service.getStats();
    res.json(stats);
  } catch (err) { next(err); }
}

async function getServices(req, res, next) {
  try {
    const services = await service.getServices();
    res.json(services);
  } catch (err) { next(err); }
}

async function purge(req, res, next) {
  try {
    const { jours = 90 } = req.body;
    const result = await service.purge(jours);
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { getLogs, getStats, getServices, purge };
