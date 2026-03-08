const db     = require('../../config/db');
const logger = require('../../utils/logger');

// ══════════════════════════════
// SEUILS
// ══════════════════════════════

async function createSeuil(data, userId) {
  const capteur = await db('capteurs').where({ id: data.capteurId }).first();
  if (!capteur) {
    const err = new Error('Capteur introuvable'); err.status = 404; throw err;
  }

  const [seuil] = await db('parametres_seuil')
    .insert({
      capteur_id:        data.capteurId,
      nom:               data.nom,
      valeur_min:        data.valeurMin,
      valeur_max:        data.valeurMax,
      duree_depassement: data.dureeDepassement,
      severite:          data.severite,
      user_id:           userId,
    })
    .returning('*');

  logger.info(`Seuil créé : ${seuil.nom || seuil.id} (capteur: ${data.capteurId})`);
  return seuil;
}

async function getSeuils(capteurId) {
  return db('parametres_seuil')
    .where({ capteur_id: capteurId, is_active: true })
    .orderBy('created_at', 'desc');
}

async function updateSeuil(id, data, userId) {
  const seuil = await db('parametres_seuil').where({ id }).first();
  if (!seuil) {
    const err = new Error('Seuil introuvable'); err.status = 404; throw err;
  }

  const [updated] = await db('parametres_seuil').where({ id }).update({
    nom:               data.nom,
    valeur_min:        data.valeurMin,
    valeur_max:        data.valeurMax,
    duree_depassement: data.dureeDepassement,
    severite:          data.severite,
    is_active:         data.isActive,
    updated_at:        db.fn.now(),
  }).returning('*');

  return updated;
}

async function deleteSeuil(id) {
  const seuil = await db('parametres_seuil').where({ id }).first();
  if (!seuil) {
    const err = new Error('Seuil introuvable'); err.status = 404; throw err;
  }
  await db('parametres_seuil').where({ id }).update({ is_active: false, updated_at: db.fn.now() });
}

// ══════════════════════════════
// ALERTES
// ══════════════════════════════

async function getAlertes({ statut, severite, deviceId, capteurId, limit = 50, offset = 0 }) {
  let query = db('alertes as a')
    .leftJoin('capteurs as c', 'c.id', 'a.capteur_id')
    .leftJoin('devices as d', 'd.id', 'a.device_id')
    .leftJoin('users as u', 'u.id', 'a.acquitte_par')
    .select(
      'a.*',
      'c.type_mesure', 'c.unite',
      'd.device_uid', 'd.nom as device_nom',
      db.raw("CONCAT(u.prenom, ' ', u.nom) as acquitte_par_nom")
    )
    .orderBy('a.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  if (statut)   query = query.where('a.statut', statut);
  if (severite) query = query.where('a.severite', severite);
  if (deviceId) query = query.where('a.device_id', deviceId);
  if (capteurId) query = query.where('a.capteur_id', capteurId);

  return query;
}

async function getAlerteById(id) {
  const alerte = await db('alertes').where({ id }).first();
  if (!alerte) {
    const err = new Error('Alerte introuvable'); err.status = 404; throw err;
  }
  return alerte;
}

async function acquitter(id, userId) {
  const alerte = await getAlerteById(id);
  if (alerte.statut !== 'ouverte') {
    const err = new Error(`Alerte déjà ${alerte.statut}`); err.status = 400; throw err;
  }

  const [updated] = await db('alertes').where({ id }).update({
    statut:       'acquittee',
    acquitte_par: userId,
    acquitte_at:  db.fn.now(),
  }).returning('*');

  logger.info(`Alerte acquittée : ${id} par userId ${userId}`);
  return updated;
}

async function resoudre(id, userId) {
  const alerte = await getAlerteById(id);
  if (alerte.statut === 'resolue') {
    const err = new Error('Alerte déjà résolue'); err.status = 400; throw err;
  }

  const [updated] = await db('alertes').where({ id }).update({
    statut:       'resolue',
    resolue_at:   db.fn.now(),
    acquitte_par: alerte.acquitte_par || userId,
    acquitte_at:  alerte.acquitte_at  || db.fn.now(),
  }).returning('*');

  logger.info(`Alerte résolue : ${id}`);
  return updated;
}

async function getStats() {
  const stats = await db('alertes')
    .select('statut', 'severite')
    .count('* as total')
    .groupBy('statut', 'severite')
    .orderBy('severite');

  const total  = await db('alertes').count('* as count').first();
  const ouvertes = await db('alertes').where({ statut: 'ouverte' }).count('* as count').first();

  return {
    total:    parseInt(total.count),
    ouvertes: parseInt(ouvertes.count),
    detail:   stats,
  };
}

module.exports = {
  createSeuil, getSeuils, updateSeuil, deleteSeuil,
  getAlertes, getAlerteById, acquitter, resoudre, getStats,
};
