const service = require('./devices.service');
const schemas = require('./devices.validation');

async function getByGateway(req, res, next) {
  try {
    const devices = await service.getByGateway(req.params.gatewayId, req.user.id, req.user.role);
    res.json(devices);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const device = await service.getById(req.params.id);
    res.json(device);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { error, value } = schemas.create.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const device = await service.create(value);
    res.status(201).json(device);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { error, value } = schemas.update.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const device = await service.update(req.params.id, value);
    res.json(device);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const { error, value } = schemas.updateStatus.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const device = await service.updateStatus(req.params.id, value);
    res.json(device);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id);
    res.json({ message: 'Device désactivé' });
  } catch (err) { next(err); }
}

module.exports = { getByGateway, getById, create, update, updateStatus, remove };
