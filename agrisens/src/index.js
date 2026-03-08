require('dotenv').config();
const app     = require('./app');
const logger  = require('./utils/logger');
const mqttService = require('./services/mqtt/mqttService');

const PORT = process.env.API_PORT || 3000;

async function bootstrap() {
  try {
    // Démarrer le serveur HTTP
    app.listen(PORT, () => {
      logger.info(`🚀 AgriSens API démarrée sur le port ${PORT} [${process.env.NODE_ENV}]`);
    });

    // Connecter le service MQTT
    await mqttService.connect();
    logger.info('📡 MQTT broker connecté');

  } catch (err) {
    logger.error('Erreur au démarrage :', err);
    process.exit(1);
  }
}

bootstrap();
