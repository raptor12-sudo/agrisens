const db     = require('../../config/db');
const logger = require('../../utils/logger');

async function checkFermeAccess(fermeId, userId, userRole) {
  const ferme = await db('fermes').where({ id: fermeId, is_active: true }).first();
  if (!ferme) {
    const err = new Error('Ferme introuvable');
    err.status = 404;
    throw err;
  }
  if (userRole !== 'admin' && ferme.owner_id !== userId) {
    const access = await db('ferme_users').where({ ferme_id: fermeId, user_id: userId }).first();
    if (!access) {
      const err = new Error('Accès refusé');
      err.status = 403;
      throw err;
    }
  }
  return ferme;
}

async function getByFerme(fermeId, userId, userRole) {
  await checkFermeAccess(fermeId, userId, userRole);
  return db('parcelles')
    .where({ ferme_id: fermeId, is_active: true })
    .orderBy('created_at', 'desc');
}

async function getById(id, userId, userRole) {
  const parcelle = await db('parcelles').where({ id, is_active: true }).first();
  if (!parcelle) {
    const err = new Error('Parcelle introuvable');
    err.status = 404;
    throw err;
  }
  await checkFermeAccess(parcelle.ferme_id, userId, userRole);
  return parcelle;
}

async function create(data, userId, userRole) {
  await checkFermeAccess(data.fermeId, userId, userRole);

  const [parcelle] = await db('parcelles')
    .insert({
      nom:          data.nom,
      surface:      data.surface,
      coord_gps:    data.coordGPS,
      latitude:     data.latitude,
      longitude:    data.longitude,
      type_culture: data.typeCulture,
      ferme_id:     data.fermeId,
    })
    .returning('*');

  logger.info(`Parcelle créée : ${parcelle.nom} (ferme: ${data.fermeId})`);
  return parcelle;
}

async function update(id, data, userId, userRole) {
  await getById(id, userId, userRole);

  const [parcelle] = await db('parcelles')
    .where({ id })
    .update({
      nom:          data.nom,
      surface:      data.surface,
      coord_gps:    data.coordGPS,
      latitude:     data.latitude,
      longitude:    data.longitude,
      type_culture: data.typeCulture,
      updated_at:   db.fn.now(),
    })
    .returning('*');

  return parcelle;
}

async function remove(id, userId, userRole) {
  await getById(id, userId, userRole);
  await db('parcelles').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  logger.info(`Parcelle désactivée : ${id}`);
}

module.exports = { getByFerme, getById, create, update, remove };
