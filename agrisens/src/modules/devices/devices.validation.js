const Joi = require('joi');

const create = Joi.object({
  deviceUid:     Joi.string().min(3).max(100).required(),
  nom:           Joi.string().max(100).optional().allow(null, ''),
  typeDevice:    Joi.string().max(50).optional().allow(null, ''),
  gatewayId:     Joi.string().uuid().required(),
  latitude:      Joi.number().min(-90).max(90).optional().allow(null),
  longitude:     Joi.number().min(-180).max(180).optional().allow(null),
  description:   Joi.string().max(500).optional().allow(null, ''),
});

const update = Joi.object({
  nom:           Joi.string().max(100).optional().allow(null, ''),
  typeDevice:    Joi.string().max(50).optional().allow(null, ''),
  statut:        Joi.string().valid('online','offline','maintenance').optional(),
  batteryLevel:  Joi.number().min(0).max(100).optional().allow(null),
  signalStrength:Joi.number().optional().allow(null),
  latitude:      Joi.number().min(-90).max(90).optional().allow(null),
  longitude:     Joi.number().min(-180).max(180).optional().allow(null),
  description:   Joi.string().max(500).optional().allow(null, ''),
});

module.exports = { create, update };
