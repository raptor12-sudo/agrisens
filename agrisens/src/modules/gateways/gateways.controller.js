const service = require('./gateways.service');
const schemas = require('./gateways.validation');

async function getByFerme(req, res, next) {
  try {
    const gws = await service.getByFerme(req.params.fermeId, req.user.id, req.user.role);
    res.json(gws);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const gw = await service.getById(req.params.id, req.user.id, req.user.role);
    res.json(gw);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { error, value } = schemas.create.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const gw = await service.create(value, req.user.id, req.user.role);
    res.status(201).json(gw);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { error, value } = schemas.update.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const gw = await service.update(req.params.id, value, req.user.id, req.user.role);
    res.json(gw);
  } catch (err) { next(err); }
}

async function heartbeat(req, res, next) {
  try {
    const gw = await service.heartbeat(req.params.id);
    res.json(gw);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Gateway désactivée' });
  } catch (err) { next(err); }
}

module.exports = { getByFerme, getById, create, update, heartbeat, remove };
