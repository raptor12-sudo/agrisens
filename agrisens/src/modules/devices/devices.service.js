const db     = require('../../config/db');
const logger = require('../../utils/logger');

async function getByGateway(gatewayId, userId, userRole) {
  const gw = await db('gateways').where({ id: gatewayId }).first();
  if (!gw) {
    const err = new Error('Gateway introuvable'); err.status = 404; throw err;
  }
  return db('devices').where({ gateway_id: gatewayId }).orderBy('created_at', 'desc');
}

async function getById(id) {
  const device = await db('devices').where({ id }).first();
  if (!device) {
    const err = new Error('Device introuvable'); err.status = 404; throw err;
  }
  return device;
}

async function create(data) {
  const existing = await db('devices').where({ device_uid: data.deviceUid || data.deviceUID }).first();
  if (existing) {
    const err = new Error('deviceUID déjà enregistré'); err.status = 409; throw err;
  }
  const [device] = await db('devices')
    .insert({
      device_uid:       data.deviceUid || data.deviceUID,
      nom:              data.nom,
      type_device:      data.typeDevice,
      firmware_version: data.firmwareVersion,
      gateway_id:       data.gatewayId,
      parcelle_id:      data.parcelleId,
      metadata:         data.metadata ? JSON.stringify(data.metadata) : null,
    })
    .returning('*');
  logger.info(`Device enregistré : ${device.device_uid}`);
  return device;
}

async function update(id, data) {
  await getById(id);
  const [device] = await db('devices').where({ id }).update({
    nom:              data.nom,
    firmware_version: data.firmwareVersion,
    parcelle_id:      data.parcelleId,
    metadata:         data.metadata ? JSON.stringify(data.metadata) : undefined,
    updated_at:       db.fn.now(),
  }).returning('*');
  return device;
}

async function updateStatus(id, data) {
  const [device] = await db('devices').where({ id }).update({
    statut:          data.statut,
    battery_level:   data.batteryLevel,
    signal_strength: data.signalStrength,
    last_seen:       db.fn.now(),
    updated_at:      db.fn.now(),
  }).returning('*');
  if (!device) {
    const err = new Error('Device introuvable'); err.status = 404; throw err;
  }
  return device;
}

async function remove(id) {
  await getById(id);
  await db('devices').where({ id }).update({ statut: 'offline', updated_at: db.fn.now() });
}

module.exports = { getByGateway, getById, create, update, updateStatus, remove };
