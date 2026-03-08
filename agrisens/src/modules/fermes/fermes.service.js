const db     = require('../../config/db');
const logger = require('../../utils/logger');

async function getAll(userId, userRole) {
  if (userRole === 'admin') {
    return db('fermes').where({ is_active: true }).orderBy('created_at', 'desc');
  }
  // Fermier voit ses fermes + celles où il est assigné
  return db('fermes as f')
    .leftJoin('ferme_users as fu', 'fu.ferme_id', 'f.id')
    .where('f.is_active', true)
    .andWhere(function () {
      this.where('f.owner_id', userId).orWhere('fu.user_id', userId);
    })
    .distinct('f.*')
    .orderBy('f.created_at', 'desc');
}

async function getById(id, userId, userRole) {
  const ferme = await db('fermes').where({ id, is_active: true }).first();
  if (!ferme) {
    const err = new Error('Ferme introuvable');
    err.status = 404;
    throw err;
  }
  // Vérifier accès
  if (userRole !== 'admin' && ferme.owner_id !== userId) {
    const access = await db('ferme_users').where({ ferme_id: id, user_id: userId }).first();
    if (!access) {
      const err = new Error('Accès refusé');
      err.status = 403;
      throw err;
    }
  }
  return ferme;
}

async function create(data, userId) {
  const [ferme] = await db('fermes')
    .insert({
      nom:          data.nom,
      localisation: data.localisation,
      latitude:     data.latitude,
      longitude:    data.longitude,
      type_culture: data.typeCulture,
      superficie:   data.superficie,
      owner_id:     userId,
    })
    .returning('*');

  logger.info(`Ferme créée : ${ferme.nom} par userId ${userId}`);
  return ferme;
}

async function update(id, data, userId, userRole) {
  await getById(id, userId, userRole);

  const [ferme] = await db('fermes')
    .where({ id })
    .update({
      nom:          data.nom,
      localisation: data.localisation,
      latitude:     data.latitude,
      longitude:    data.longitude,
      type_culture: data.typeCulture,
      superficie:   data.superficie,
      updated_at:   db.fn.now(),
    })
    .returning('*');

  return ferme;
}

async function remove(id, userId, userRole) {
  await getById(id, userId, userRole);
  await db('fermes').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
  logger.info(`Ferme désactivée : ${id}`);
}

async function assignUser(fermeId, { userId, role }, currentUserId, userRole) {
  await getById(fermeId, currentUserId, userRole);

  // Vérifier que l'user existe
  const user = await db('users').where({ id: userId, is_active: true }).first();
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.status = 404;
    throw err;
  }

  // Upsert
  const existing = await db('ferme_users').where({ ferme_id: fermeId, user_id: userId }).first();
  if (existing) {
    await db('ferme_users').where({ ferme_id: fermeId, user_id: userId }).update({ role });
  } else {
    await db('ferme_users').insert({ ferme_id: fermeId, user_id: userId, role });
  }

  return { fermeId, userId, role };
}

async function removeUser(fermeId, userId, currentUserId, userRole) {
  await getById(fermeId, currentUserId, userRole);
  await db('ferme_users').where({ ferme_id: fermeId, user_id: userId }).delete();
  logger.info(`User ${userId} retiré de la ferme ${fermeId}`);
}

async function getUsers(fermeId, currentUserId, userRole) {
  await getById(fermeId, currentUserId, userRole);
  return db('ferme_users as fu')
    .join('users as u', 'u.id', 'fu.user_id')
    .where('fu.ferme_id', fermeId)
    .select('u.id', 'u.nom', 'u.prenom', 'u.email', 'fu.role', 'fu.assigned_at');
}

module.exports = { getAll, getById, create, update, remove, assignUser, removeUser, getUsers };
