const service = require('./alertes.service');
const schemas = require('./alertes.validation');

// ── Seuils ──
async function createSeuil(req, res, next) {
  try {
    const { error, value } = schemas.createSeuil.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const seuil = await service.createSeuil(value, req.user.id);
    res.status(201).json(seuil);
  } catch (err) { next(err); }
}

async function getSeuils(req, res, next) {
  try {
    const seuils = await service.getSeuils(req.params.capteurId);
    res.json(seuils);
  } catch (err) { next(err); }
}

async function updateSeuil(req, res, next) {
  try {
    const { error, value } = schemas.updateSeuil.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const seuil = await service.updateSeuil(req.params.id, value, req.user.id);
    res.json(seuil);
  } catch (err) { next(err); }
}

async function deleteSeuil(req, res, next) {
  try {
    await service.deleteSeuil(req.params.id);
    res.json({ message: 'Seuil désactivé' });
  } catch (err) { next(err); }
}

// ── Alertes ──
async function getAlertes(req, res, next) {
  try {
    const { statut, severite, deviceId, capteurId, limit, offset } = req.query;
    const alertes = await service.getAlertes({ statut, severite, deviceId, capteurId, limit, offset });
    res.json(alertes);
  } catch (err) { next(err); }
}

async function getAlerteById(req, res, next) {
  try {
    const alerte = await service.getAlerteById(req.params.id);
    res.json(alerte);
  } catch (err) { next(err); }
}

async function acquitter(req, res, next) {
  try {
    const alerte = await service.acquitter(req.params.id, req.user.id);
    res.json(alerte);
  } catch (err) { next(err); }
}

async function resoudre(req, res, next) {
  try {
    const alerte = await service.resoudre(req.params.id, req.user.id);
    res.json(alerte);
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const stats = await service.getStats();
    res.json(stats);
  } catch (err) { next(err); }
}

module.exports = {
  createSeuil, getSeuils, updateSeuil, deleteSeuil,
  getAlertes, getAlerteById, acquitter, resoudre, getStats,
};
