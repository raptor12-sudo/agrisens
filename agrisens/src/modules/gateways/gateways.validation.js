const Joi = require('joi');

const create = Joi.object({
  nom:        Joi.string().min(2).max(100).required(),
  fermeId:    Joi.string().uuid().required(),
  ipAddress:  Joi.string().ip().optional().allow(null, ''),
  latitude:   Joi.number().min(-90).max(90).optional().allow(null),
  longitude:  Joi.number().min(-180).max(180).optional().allow(null),
  lorawanEnv: Joi.string().valid('urban','suburban','rural','open').optional().allow(null, ''),
  description:Joi.string().max(500).optional().allow(null, ''),
});

const update = Joi.object({
  nom:        Joi.string().min(2).max(100).optional(),
  ipAddress:  Joi.string().ip().optional().allow(null, ''),
  latitude:   Joi.number().min(-90).max(90).optional().allow(null),
  longitude:  Joi.number().min(-180).max(180).optional().allow(null),
  lorawanEnv: Joi.string().valid('urban','suburban','rural','open').optional().allow(null, ''),
  description:Joi.string().max(500).optional().allow(null, ''),
  statut:     Joi.string().valid('online','offline','maintenance').optional(),
});

module.exports = { create, update };
