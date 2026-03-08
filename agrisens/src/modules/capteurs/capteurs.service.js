const db     = require('../../config/db');
const influx = require('../../services/influx/influxService');
const logger = require('../../utils/logger');

let broadcast = null;
function setBroadcast(fn) { broadcast = fn; }

async function getByDevice(deviceId) {
  const device = await db('devices').where({ id: deviceId }).first();
  if (!device) {
    const err = new Error('Device introuvable'); err.status = 404; throw err;
  }
  return db('capteurs').where({ device_id: deviceId, is_active: true });
}

async function getById(id) {
  const capteur = await db('capteurs').where({ id }).first();
  if (!capteur) {
    const err = new Error('Capteur introuvable'); err.status = 404; throw err;
  }
  return capteur;
}

async function create(data) {
  const device = await db('devices').where({ id: data.deviceId }).first();
  if (!device) {
    const err = new Error('Device introuvable'); err.status = 404; throw err;
  }
  const [capteur] = await db('capteurs').insert({
    device_id:          data.deviceId,
    type_mesure:        data.typeMesure,
    unite:              data.unite,
    precision:          data.precision,
    range_min:          data.rangeMin,
    range_max:          data.rangeMax,
    influx_measurement: data.influxMeasurement,
    influx_field:       data.influxField,
  }).returning('*');
  logger.info(`Capteur créé : ${capteur.type_mesure}`);
  return capteur;
}

async function update(id, data) {
  await getById(id);
  const [capteur] = await db('capteurs').where({ id }).update({
    unite:     data.unite,
    precision: data.precision,
    range_min: data.rangeMin,
    range_max: data.rangeMax,
    is_active: data.isActive,
  }).returning('*');
  return capteur;
}

async function ingestLecture(capteurId, valeur, qualite = 100) {
  const capteur = await getById(capteurId);
  const device  = await db('devices').where({ id: capteur.device_id }).first();

  // 1. InfluxDB
  await influx.writeMesure({
    measurement: capteur.influx_measurement,
    field:       capteur.influx_field,
    value:       valeur,
    tags: {
      device_uid:  device.device_uid,
      capteur_id:  capteurId,
      type_mesure: capteur.type_mesure,
    },
  });

  // 2. Cache PostgreSQL
  const existing = await db('lectures_cache').where({ capteur_id: capteurId }).first();
  if (existing) {
    await db('lectures_cache').where({ capteur_id: capteurId }).update({
      derniere_valeur:  valeur,
      unite:            capteur.unite,
      qualite,
      influx_timestamp: db.fn.now(),
      updated_at:       db.fn.now(),
    });
  } else {
    await db('lectures_cache').insert({
      capteur_id:       capteurId,
      device_id:        capteur.device_id,
      derniere_valeur:  valeur,
      unite:            capteur.unite,
      qualite,
      influx_timestamp: db.fn.now(),
    });
  }

  // 3. Vérifier seuils
  await checkSeuils(capteurId, valeur, capteur);

  // 4. 🔴 Broadcaster via SSE au frontend
  if (broadcast) {
    broadcast('lecture', {
      capteurId,
      deviceId:   capteur.device_id,
      deviceUid:  device.device_uid,
      typeMesure: capteur.type_mesure,
      valeur,
      unite:      capteur.unite,
      qualite,
      timestamp:  new Date().toISOString(),
    });
  }

  logger.debug(`Lecture ingérée : capteur ${capteurId} = ${valeur} ${capteur.unite}`);
  return { capteurId, valeur, unite: capteur.unite, timestamp: new Date() };
}

async function checkSeuils(capteurId, valeur, capteur) {
  const seuils = await db('parametres_seuil').where({ capteur_id: capteurId, is_active: true });
  for (const seuil of seuils) {
    const depasse = (seuil.valeur_min !== null && valeur < seuil.valeur_min)
                 || (seuil.valeur_max !== null && valeur > seuil.valeur_max);
    if (depasse) {
      const message = valeur < seuil.valeur_min
        ? `Valeur ${valeur}${capteur.unite} sous le seuil min (${seuil.valeur_min})`
        : `Valeur ${valeur}${capteur.unite} au-dessus du seuil max (${seuil.valeur_max})`;

      await db('alertes').insert({
        type_alerte:      capteur.type_mesure,
        severite:         seuil.severite,
        message,
        valeur_mesuree:   valeur,
        seuil_id:         seuil.id,
        capteur_id:       capteurId,
        device_id:        capteur.device_id,
        influx_timestamp: db.fn.now(),
      });

      // Broadcaster l'alerte aussi
      if (broadcast) {
        broadcast('alerte', { message, severite: seuil.severite, capteurId, valeur });
      }

      logger.warn(`🚨 Alerte : ${message}`);
    }
  }
}

async function getDerniere(capteurId) {
  await getById(capteurId);
  return db('lectures_cache').where({ capteur_id: capteurId }).first();
}

async function getLectures(capteurId, { from = '-1h', to, granularity = '1m' }) {
  const capteur = await getById(capteurId);
  return influx.queryMesures({
    measurement: capteur.influx_measurement,
    field:       capteur.influx_field,
    from, to, granularity,
  });
}

async function getStats(capteurId, date) {
  const capteur = await getById(capteurId);
  const device  = await db('devices').where({ id: capteur.device_id }).first();
  const today   = date || new Date().toISOString().split('T')[0];
  const cached  = await db('agregats_journaliers').where({ capteur_id: capteurId, date: today }).first();
  if (cached) return cached;
  return influx.queryStats({
    measurement: capteur.influx_measurement,
    field:       capteur.influx_field,
    deviceUID:   device.device_uid,
    date:        today,
  });
}

module.exports = {
  getByDevice, getById, create, update, setBroadcast,
  ingestLecture, getDerniere, getLectures, getStats,
};
