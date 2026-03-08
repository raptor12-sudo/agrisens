const Joi = require('joi');

const register = Joi.object({
  nom:        Joi.string().min(2).max(100).required(),
  prenom:     Joi.string().min(2).max(100).required(),
  email:      Joi.string().email().required(),
  motDePasse: Joi.string().min(8).required(),
  role:       Joi.string().valid('admin','fermier','technicien','observateur').default('fermier'),
});

const login = Joi.object({
  email:      Joi.string().email().required(),
  motDePasse: Joi.string().required(),
});

const refresh = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { register, login, refresh };
