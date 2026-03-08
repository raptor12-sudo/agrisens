const db     = require('../../config/db');
const logger = require('../../utils/logger');

async function checkFermeAccess(fermeId, userId, userRole) {
  const ferme = await db('fermes').where({ id: fermeId, is_active: true }).first();
  if (!ferme) {
    const err = new Error('Ferme introuvable'); err.status = 404; throw err;
  }
  if (userRole !== 'admin' && ferme.owner_id !== userId) {
    const access = await db('ferme_users').where({ ferme_id: fermeId, user_id: userId }).first();
    if (!access) {
      const err = new Error('Accès refusé'); err.status = 403; throw err;
    }
  }
}

async function getByFerme(fermeId, userId, userRole) {
  await checkFermeAccess(fermeId, userId, userRole);
  return db('gateways').where({ ferme_id: fermeId }).orderBy('created_at', 'desc');
}

async function getById(id, userId, userRole) {
  const gw = await db('gateways').where({ id }).first();
  if (!gw) {
    const err = new Error('Gateway introuvable'); err.status = 404; throw err;
  }
  await checkFermeAccess(gw.ferme_id, userId, userRole);
  return gw;
}

async function create(data, userId, userRole) {
  await checkFermeAccess(data.fermeId, userId, userRole);
  const [gw] = await db('gateways')
    .insert({
      nom:              data.nom,
      ip_address:       data.ipAddress,
      mac_address:      data.macAddress,
      firmware_version: data.firmwareVersion,
      metadata:         data.metadata ? JSON.stringify(data.metadata) : null,
      ferme_id:         data.fermeId,
    })
    .returning('*');
  logger.info(`Gateway créée : ${gw.nom} (ferme: ${data.fermeId})`);
  return gw;
}

async function update(id, data, userId, userRole) {
  await getById(id, userId, userRole);
  const [gw] = await db('gateways').where({ id }).update({
    nom:              data.nom,
    ip_address:       data.ipAddress,
    firmware_version: data.firmwareVersion,
    metadata:         data.metadata ? JSON.stringify(data.metadata) : undefined,
    updated_at:       db.fn.now(),
  }).returning('*');
  return gw;
}

async function heartbeat(id) {
  const [gw] = await db('gateways').where({ id }).update({
    last_heartbeat: db.fn.now(),
    last_seen:      db.fn.now(),
    statut:         'online',
    updated_at:     db.fn.now(),
  }).returning('*');
  if (!gw) {
    const err = new Error('Gateway introuvable'); err.status = 404; throw err;
  }
  return gw;
}

async function remove(id, userId, userRole) {
  await getById(id, userId, userRole);
  await db('gateways').where({ id }).update({ statut: 'offline', updated_at: db.fn.now() });
}

module.exports = { getByFerme, getById, create, update, heartbeat, remove };
