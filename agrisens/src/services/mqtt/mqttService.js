const mqtt   = require('mqtt');
const logger = require('../../utils/logger');

let client = null;

const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'agrisens';

function connect() {
  return new Promise((resolve, reject) => {
    client = mqtt.connect(process.env.MQTT_URL, {
      clientId: process.env.MQTT_CLIENT_ID || 'agrisens_api',
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clean:    true,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      logger.info('✅ MQTT connecté');

      // S'abonner à tous les topics AgriSens
      client.subscribe(`${TOPIC_PREFIX}/#`, { qos: 1 }, (err) => {
        if (err) return reject(err);
        logger.info(`📥 Abonné à ${TOPIC_PREFIX}/#`);
        resolve(client);
      });
    });

    client.on('message', async (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString());
        logger.debug(`📨 MQTT reçu [${topic}]`, data);
        await handleMessage(topic, data);
      } catch (err) {
        logger.error(`Erreur parsing MQTT [${topic}]`, err);
      }
    });

    client.on('error', (err) => {
      logger.error('Erreur MQTT :', err.message);
    });

    client.on('reconnect', () => {
      logger.warn('🔄 MQTT reconnexion...');
    });
  });
}

async function handleMessage(topic, data) {
  // Format attendu : agrisens/{fermeId}/{deviceUID}/{type}
  // Ex : agrisens/ferme-uuid/device-uid/data
  const parts = topic.split('/');
  if (parts.length < 4) return;

  const [, fermeId, deviceUID, topicType] = parts;

  if (topicType === 'data') {
    // TODO Phase 4 : écrire dans InfluxDB + mettre à jour lectures_cache
    logger.debug(`📊 Data reçue de ${deviceUID} (ferme: ${fermeId})`, data);
  }

  if (topicType === 'heartbeat') {
    // TODO Phase 3 : PATCH /gateways/:id/heartbeat
    logger.debug(`💓 Heartbeat de ${deviceUID}`);
  }

  if (topicType === 'status') {
    // TODO Phase 3 : PATCH /devices/:id/status
    logger.debug(`📶 Status update de ${deviceUID}`, data);
  }
}

function publish(topic, payload, options = {}) {
  if (!client) throw new Error('MQTT non connecté');
  client.publish(topic, JSON.stringify(payload), { qos: 1, ...options });
}

function getClient() { return client; }

module.exports = { connect, publish, getClient };
