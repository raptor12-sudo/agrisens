const Joi = require('joi');

const create = Joi.object({
  nom:         Joi.string().min(2).max(150).required(),
  fermeId:     Joi.string().uuid().required(),
  surface:     Joi.number().positive().optional(),
  coordGPS:    Joi.string().optional(),
  latitude:    Joi.number().min(-90).max(90).optional(),
  longitude:   Joi.number().min(-180).max(180).optional(),
  typeCulture: Joi.string().max(100).optional(),
});

const update = Joi.object({
  nom:         Joi.string().min(2).max(150).optional(),
  surface:     Joi.number().positive().optional(),
  coordGPS:    Joi.string().optional(),
  latitude:    Joi.number().min(-90).max(90).optional(),
  longitude:   Joi.number().min(-180).max(180).optional(),
  typeCulture: Joi.string().max(100).optional(),
});

module.exports = { create, update };
