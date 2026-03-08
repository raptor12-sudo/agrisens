const Joi = require('joi');

const create = Joi.object({
  deviceId:           Joi.string().uuid().required(),
  typeMesure:         Joi.string().valid(
    'temperature','humidite_sol','humidite_air','ph',
    'conductivite','luminosite','co2',
    'npk_azote','npk_phosphore','npk_potassium',
    'pression','vitesse_vent','pluviometrie'
  ).required(),
  unite:              Joi.string().max(20).required(),
  precision:          Joi.number().optional(),
  rangeMin:           Joi.number().optional(),
  rangeMax:           Joi.number().optional(),
  influxMeasurement:  Joi.string().max(100).required(),
  influxField:        Joi.string().max(100).required(),
});

const update = Joi.object({
  unite:     Joi.string().max(20).optional(),
  precision: Joi.number().optional(),
  rangeMin:  Joi.number().optional(),
  rangeMax:  Joi.number().optional(),
  isActive:  Joi.boolean().optional(),
});

module.exports = { create, update };
