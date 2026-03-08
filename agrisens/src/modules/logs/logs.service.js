const db = require('../../config/db');

async function getLogs({ service, niveau, from, to, limit = 100, offset = 0 }) {
  let query = db('logs_systeme as l')
    .leftJoin('users as u', 'u.id', 'l.user_id')
    .leftJoin('devices as d', 'd.id', 'l.device_id')
    .select(
      'l.*',
      db.raw("CONCAT(u.prenom, ' ', u.nom) as user_nom"),
      'd.device_uid'
    )
    .orderBy('l.timestamp', 'desc')
    .limit(limit)
    .offset(offset);

  if (service) query = query.where('l.service', service);
  if (niveau)  query = query.where('l.niveau', niveau);
  if (from)    query = query.where('l.timestamp', '>=', from);
  if (to)      query = query.where('l.timestamp', '<=', to);

  return query;
}

async function createLog({ service, niveau, message, stack, context, ipAddress, userId, deviceId, gatewayId }) {
  const [log] = await db('logs_systeme')
    .insert({
      service,
      niveau,
      message,
      stack:      stack      || null,
      context:    context    ? JSON.stringify(context) : null,
      ip_address: ipAddress  || null,
      user_id:    userId     || null,
      device_id:  deviceId   || null,
      gateway_id: gatewayId  || null,
    })
    .returning('*');
  return log;
}

async function getStats() {
  const parNiveau = await db('logs_systeme')
    .select('niveau')
    .count('* as total')
    .groupBy('niveau')
    .orderBy('total', 'desc');

  const parService = await db('logs_systeme')
    .select('service')
    .count('* as total')
    .groupBy('service')
    .orderBy('total', 'desc')
    .limit(10);

  const recents = await db('logs_systeme')
    .where('niveau', 'error')
    .orWhere('niveau', 'critical')
    .orderBy('timestamp', 'desc')
    .limit(5);

  const total = await db('logs_systeme').count('* as count').first();

  return {
    total:      parseInt(total.count),
    parNiveau,
    parService,
    erreursRecentes: recents,
  };
}

async function purge(joursRetention = 90) {
  const date = new Date();
  date.setDate(date.getDate() - joursRetention);

  const count = await db('logs_systeme')
    .where('timestamp', '<', date)
    .delete();

  return { supprimés: count, avant: date };
}

async function getServices() {
  return db('logs_systeme')
    .distinct('service')
    .orderBy('service')
    .pluck('service');
}

module.exports = { getLogs, createLog, getStats, purge, getServices };
