const bcrypt = require('bcryptjs');

const userFixture = {
  id:            '11111111-1111-1111-1111-111111111111',
  nom:           'Diallo',
  prenom:        'Tidiane',
  email:         'tidiane@agrisens.io',
  mot_de_passe:  bcrypt.hashSync('agrisens123', 1), // rounds=1 pour tests rapides
  role:          'admin',
  is_active:     true,
  refresh_token: null,
  last_login:    null,
  created_at:    new Date().toISOString(),
  updated_at:    new Date().toISOString(),
};

const fermeFixture = {
  id:           '22222222-2222-2222-2222-222222222222',
  nom:          'Ferme Test',
  localisation: 'Dakar',
  type_culture: 'Maraîchage',
  superficie:   5.5,
  is_active:    true,
  owner_id:     userFixture.id,
  created_at:   new Date().toISOString(),
  updated_at:   new Date().toISOString(),
};

const gatewayFixture = {
  id:         '33333333-3333-3333-3333-333333333333',
  nom:        'Gateway Test',
  ip_address: '192.168.1.100',
  statut:     'online',
  ferme_id:   fermeFixture.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const deviceFixture = {
  id:          '44444444-4444-4444-4444-444444444444',
  device_uid:  'TEST-SENSOR-001',
  nom:         'Capteur Test',
  type_device: 'capteur_sol',
  statut:      'online',
  gateway_id:  gatewayFixture.id,
  created_at:  new Date().toISOString(),
  updated_at:  new Date().toISOString(),
};

const capteurFixture = {
  id:                 '55555555-5555-5555-5555-555555555555',
  type_mesure:        'temperature',
  unite:              '°C',
  range_min:          -10,
  range_max:          60,
  influx_measurement: 'sol_metrics',
  influx_field:       'temperature',
  is_active:          true,
  device_id:          deviceFixture.id,
  created_at:         new Date().toISOString(),
};

module.exports = { userFixture, fermeFixture, gatewayFixture, deviceFixture, capteurFixture };
