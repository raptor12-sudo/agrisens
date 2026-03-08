const request = require('supertest');
const jwt     = require('jsonwebtoken');

jest.mock('../../src/config/db', () => {
  const mockDb = jest.fn();
  mockDb.fn = { now: jest.fn(() => new Date()) };
  return mockDb;
});

jest.mock('../../src/config/influx', () => ({
  writeApi: { writePoint: jest.fn(), flush: jest.fn() },
  queryApi: { queryRows: jest.fn() },
}));

jest.mock('../../src/services/influx/influxService', () => ({
  writeMesure:  jest.fn(),
  queryMesures: jest.fn().mockResolvedValue([]),
  queryStats:   jest.fn().mockResolvedValue(null),
}));

jest.mock('../../src/modules/logs/logs.service', () => ({
  createLog: jest.fn().mockResolvedValue({}),
}));

jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({ on: jest.fn(), subscribe: jest.fn(), publish: jest.fn() })),
}));

process.env.JWT_SECRET             = 'test_secret';
process.env.JWT_EXPIRES_IN         = '15m';
process.env.JWT_REFRESH_SECRET     = 'test_refresh_secret';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.INFLUX_URL             = 'http://localhost:8086';
process.env.INFLUX_TOKEN           = 'test_token';
process.env.INFLUX_ORG             = 'test_org';
process.env.INFLUX_BUCKET          = 'test_bucket';
process.env.MQTT_URL               = 'mqtt://localhost:1883';

const db  = require('../../src/config/db');
const app = require('../../src/app');
const { userFixture, fermeFixture } = require('../fixtures');

// Helper — générer un token admin valide
function adminToken() {
  return jwt.sign(
    { id: userFixture.id, email: userFixture.email, role: 'admin' },
    'test_secret',
    { expiresIn: '15m' }
  );
}

describe('GET /api/fermes', () => {

  it('200 retourne la liste des fermes', async () => {
    db.mockImplementation(() => ({
      where:    jest.fn().mockReturnThis(),
      first:    jest.fn().mockResolvedValue(userFixture),
      orderBy:  jest.fn().mockResolvedValue([fermeFixture]),
    }));

    const res = await request(app)
      .get('/api/fermes')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('401 sans token', async () => {
    const res = await request(app).get('/api/fermes');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/fermes', () => {

  it('201 crée une ferme', async () => {
    db.mockImplementation(() => ({
      where:     jest.fn().mockReturnThis(),
      first:     jest.fn().mockResolvedValue(userFixture),
      insert:    jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([fermeFixture]),
    }));

    const res = await request(app)
      .post('/api/fermes')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ nom: 'Ferme Test', localisation: 'Dakar' });

    expect(res.status).toBe(201);
    expect(res.body.nom).toBe('Ferme Test');
  });

  it('400 si nom manquant', async () => {
    db.mockImplementation(() => ({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(userFixture),
    }));

    const res = await request(app)
      .post('/api/fermes')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ localisation: 'Dakar' });

    expect(res.status).toBe(400);
  });
});
