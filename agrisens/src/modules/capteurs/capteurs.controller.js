const service = require('./capteurs.service');
const schemas = require('./capteurs.validation');

async function getByDevice(req, res, next) {
  try {
    const capteurs = await service.getByDevice(req.params.deviceId);
    res.json(capteurs);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const capteur = await service.getById(req.params.id);
    res.json(capteur);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { error, value } = schemas.create.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const capteur = await service.create(value);
    res.status(201).json(capteur);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { error, value } = schemas.update.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const capteur = await service.update(req.params.id, value);
    res.json(capteur);
  } catch (err) { next(err); }
}

async function ingest(req, res, next) {
  try {
    const { valeur, qualite } = req.body;
    if (valeur === undefined) return res.status(400).json({ error: 'valeur requis' });
    const result = await service.ingestLecture(req.params.id, valeur, qualite);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function getDerniere(req, res, next) {
  try {
    const cache = await service.getDerniere(req.params.id);
    res.json(cache || { message: 'Aucune lecture disponible' });
  } catch (err) { next(err); }
}

async function getLectures(req, res, next) {
  try {
    const { from, to, granularity } = req.query;
    const lectures = await service.getLectures(req.params.id, { from, to, granularity });
    res.json(lectures);
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const stats = await service.getStats(req.params.id, req.query.date);
    res.json(stats || { message: 'Aucune donnée pour cette date' });
  } catch (err) { next(err); }
}

module.exports = { getByDevice, getById, create, update, ingest, getDerniere, getLectures, getStats };
