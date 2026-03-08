const Joi = require('joi');

const createSeuil = Joi.object({
  capteurId:        Joi.string().uuid().required(),
  nom:              Joi.string().max(150).optional(),
  valeurMin:        Joi.number().optional(),
  valeurMax:        Joi.number().optional(),
  dureeDepassement: Joi.number().integer().min(0).default(0),
  severite:         Joi.string().valid('info','warning','critical','urgence').default('warning'),
}).or('valeurMin', 'valeurMax');

const updateSeuil = Joi.object({
  nom:              Joi.string().max(150).optional(),
  valeurMin:        Joi.number().optional().allow(null),
  valeurMax:        Joi.number().optional().allow(null),
  dureeDepassement: Joi.number().integer().min(0).optional(),
  severite:         Joi.string().valid('info','warning','critical','urgence').optional(),
  isActive:         Joi.boolean().optional(),
});

const acquitter = Joi.object({
  commentaire: Joi.string().max(500).optional(),
});

module.exports = { createSeuil, updateSeuil, acquitter };
