const service = require('./fermes.service');
const schemas = require('./fermes.validation');

async function getAll(req, res, next) {
  try {
    const fermes = await service.getAll(req.user.id, req.user.role);
    res.json(fermes);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const ferme = await service.getById(req.params.id, req.user.id, req.user.role);
    res.json(ferme);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { error, value } = schemas.create.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const ferme = await service.create(value, req.user.id);
    res.status(201).json(ferme);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { error, value } = schemas.update.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const ferme = await service.update(req.params.id, value, req.user.id, req.user.role);
    res.json(ferme);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id, req.user.id, req.user.role);
    res.json({ message: 'Ferme désactivée' });
  } catch (err) { next(err); }
}

async function assignUser(req, res, next) {
  try {
    const { error, value } = schemas.assignUser.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const result = await service.assignUser(req.params.id, value, req.user.id, req.user.role);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function removeUser(req, res, next) {
  try {
    await service.removeUser(req.params.id, req.params.userId, req.user.id, req.user.role);
    res.json({ message: 'Utilisateur retiré' });
  } catch (err) { next(err); }
}

async function getUsers(req, res, next) {
  try {
    const users = await service.getUsers(req.params.id, req.user.id, req.user.role);
    res.json(users);
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove, assignUser, removeUser, getUsers };
