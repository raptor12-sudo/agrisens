const Joi = require('joi');

const create = Joi.object({
  nom:         Joi.string().min(2).max(150).required(),
  localisation: Joi.string().max(255).optional(),
  latitude:    Joi.number().min(-90).max(90).optional(),
  longitude:   Joi.number().min(-180).max(180).optional(),
  typeCulture: Joi.string().max(100).optional(),
  superficie:  Joi.number().positive().optional(),
});

const update = Joi.object({
  nom:         Joi.string().min(2).max(150).optional(),
  localisation: Joi.string().max(255).optional(),
  latitude:    Joi.number().min(-90).max(90).optional(),
  longitude:   Joi.number().min(-180).max(180).optional(),
  typeCulture: Joi.string().max(100).optional(),
  superficie:  Joi.number().positive().optional(),
});

const assignUser = Joi.object({
  userId: Joi.string().uuid().required(),
  role:   Joi.string().valid('fermier','technicien','observateur').required(),
});

module.exports = { create, update, assignUser };
