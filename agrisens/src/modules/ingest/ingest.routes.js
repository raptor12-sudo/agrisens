const express = require('express');
const router  = express.Router();
const db      = require('../../config/db');
const logger  = require('../../utils/logger');

// POST /api/ingest — Raspberry Pi Gateway → AgriSens
router.post('/', async (req, res, next) => {
  try {
    const { gateway_uid, api_key, node_id, data, score_sante, rssi, snr, sf } = req.body;

    // Auth par API key
    if (process.env.GATEWAY_API_KEY && api_key !== process.env.GATEWAY_API_KEY) {
      return res.status(401).json({ error: 'API key invalide' });
    }
    if (!node_id || !data) {
      return res.status(400).json({ error: 'node_id et data requis' });
    }

    // Trouver le device
    const device = await db('devices').where({ device_uid: node_id }).first();
    if (!device) {
      return res.status(404).json({ error: `Device ${node_id} non enregistré` });
    }

    // Mettre à jour statut device
    await db('devices').where({ id: device.id }).update({
      statut:                'online',
      derniere_transmission: new Date(),
      battery_level:         data.batterie ?? device.battery_level,
      lora_rssi:             rssi ?? data.rssi ?? null,
      lora_snr:              snr  ?? data.snr  ?? null,
      updated_at:            db.fn.now(),
    });

    // Log transmission LoRa
    await db('lora_transmissions').insert({
      device_uid:       node_id,
      gateway_id:       null,
      rssi:             rssi ?? data.rssi ?? null,
      snr:              snr  ?? data.snr  ?? null,
      spreading_factor: sf   ?? data.sf   ?? null,
      payload_raw:      JSON.stringify(data),
      payload_size:     JSON.stringify(data).length,
      decoded:          true,
    }).catch(() => {});

    // Récupérer les capteurs du device
    const capteurs = await db('capteurs').where({ device_id: device.id, is_active: true });

    const FIELD_MAP = {
      temp:         'temperature',
      hum_sol:      'humidite_sol',
      hum_air:      'humidite_air',
      ph:           'ph',
      conductivite: 'conductivite',
      luminosite:   'luminosite',
      pluie_24h:    'pluviometrie',
    };

    const resultats = {};

    for (const capteur of capteurs) {
      const fieldKey = Object.keys(FIELD_MAP).find(k => FIELD_MAP[k] === capteur.type_mesure);
      const valeur   = fieldKey ? data[fieldKey] : null;
      if (valeur === null || valeur === undefined) continue;

      resultats[capteur.type_mesure] = valeur;

      // Injecter dans InfluxDB via le service capteurs existant
      try {
        const influxService = require('../capteurs/capteurs.influx');
        await influxService.write({
          capteurId:   capteur.id,
          deviceId:    device.id,
          measurement: capteur.influx_measurement || 'capteurs_champ',
          field:       capteur.influx_field,
          value:       parseFloat(valeur),
          tags: {
            node_id,
            zone:    data.zone    || 'unknown',
            culture: data.culture || 'unknown',
          },
        });
      } catch (influxErr) {
        logger.error(`InfluxDB: ${influxErr.message}`);
      }

      // Vérifier seuils → alertes
      const seuils = await db('parametres_seuil').where({ capteur_id: capteur.id, is_active: true });
      for (const seuil of seuils) {
        let triggered = false;
        let message   = '';
        if (seuil.valeur_min !== null && valeur < seuil.valeur_min) {
          triggered = true;
          message   = seuil.message || `${capteur.type_mesure} trop bas: ${valeur}${capteur.unite}`;
        }
        if (seuil.valeur_max !== null && valeur > seuil.valeur_max) {
          triggered = true;
          message   = seuil.message || `${capteur.type_mesure} trop élevé: ${valeur}${capteur.unite}`;
        }
        if (triggered) {
          const existing = await db('alertes')
            .where({ capteur_id: capteur.id, statut: 'ouverte' })
            .where('created_at', '>', db.raw("NOW() - INTERVAL '30 minutes'"))
            .first();
          if (!existing) {
            await db('alertes').insert({
              device_id:      device.id,
              capteur_id:     capteur.id,
              seuil_id:       seuil.id,
              type_alerte:    capteur.type_mesure,
              severite:       seuil.severite,
              valeur_mesuree: valeur,
              message,
              statut:         'ouverte',
            });
            logger.warn(`ALERTE [${seuil.severite}]: ${message}`);
          }
        }
      }
    }

    logger.info(`Ingest OK: ${node_id} → ${Object.keys(resultats).length} mesures`);
    res.json({ success: true, device: device.device_uid, mesures: Object.keys(resultats).length, resultats });

  } catch (err) { next(err); }
});

// GET /api/ingest/status
router.get('/status', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
