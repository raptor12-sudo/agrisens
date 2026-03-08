const service = require('./parcelles.service');
const schemas = require('./parcelles.validation');

async function getByFerme(req, res, next) {
  try {
    const parcelles = await service.getByFerme(req.params.fermeId, req.user.id, req.user.role);
    res.json(parcelles);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const parcelle = await service.getById(req.params.id, req.user.id, req.user.role);
    res.json(parcelle);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { error, value } = schemas.create.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const parcelle = await service.create(value, req.user.id, req.user.role);
    res.status(201).json(parcelle);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { error, value } = schemas.update.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const parcelle = await service.update(req.params.id, value, req.user.id, req.user.role);
    res.json(parcelle);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Parcelle désactivée' });
  } catch (err) { next(err); }
}

module.exports = { getByFerme, getById, create, update, remove };
