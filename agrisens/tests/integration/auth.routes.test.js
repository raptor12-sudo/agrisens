const request = require('supertest');

// Mock DB et services avant import de l'app
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
  getLogs:   jest.fn().mockResolvedValue([]),
  getStats:  jest.fn().mockResolvedValue({}),
}));

// Mock MQTT
jest.mock('mqtt', () => ({
  connect: jest.fn(() => ({
    on:        jest.fn(),
    subscribe: jest.fn(),
    publish:   jest.fn(),
  })),
}));

process.env.JWT_SECRET              = 'test_secret';
process.env.JWT_EXPIRES_IN          = '15m';
process.env.JWT_REFRESH_SECRET      = 'test_refresh_secret';
process.env.JWT_REFRESH_EXPIRES_IN  = '7d';
process.env.INFLUX_URL              = 'http://localhost:8086';
process.env.INFLUX_TOKEN            = 'test_token';
process.env.INFLUX_ORG              = 'test_org';
process.env.INFLUX_BUCKET           = 'test_bucket';
process.env.MQTT_URL                = 'mqtt://localhost:1883';

const bcrypt = require('bcryptjs');
const db     = require('../../src/config/db');
const app    = require('../../src/app');
const { userFixture } = require('../fixtures');

describe('POST /api/auth/login', () => {

  it('200 avec credentials valides', async () => {
    const hash = await bcrypt.hash('agrisens123', 1);
    db.mockImplementation(() => ({
      where:  jest.fn().mockReturnThis(),
      first:  jest.fn().mockResolvedValue({ ...userFixture, mot_de_passe: hash }),
      update: jest.fn().mockReturnThis(),
    }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tidiane@agrisens.io', motDePasse: 'agrisens123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user).not.toHaveProperty('mot_de_passe');
  });

  it('401 avec mauvais mot de passe', async () => {
    const hash = await bcrypt.hash('autremdp', 1);
    db.mockImplementation(() => ({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ ...userFixture, mot_de_passe: hash }),
    }));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tidiane@agrisens.io', motDePasse: 'mauvais' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('400 si email manquant', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ motDePasse: 'agrisens123' });

    expect(res.status).toBe(400);
  });

  it('400 si body vide', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {

  it('201 avec données valides', async () => {
    const hash = await bcrypt.hash('agrisens123', 1);
    db.mockImplementation(() => ({
      where:     jest.fn().mockReturnThis(),
      first:     jest.fn().mockResolvedValue(null),
      insert:    jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ ...userFixture, mot_de_passe: hash }]),
      update:    jest.fn().mockReturnThis(),
    }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nom: 'Diallo', prenom: 'Tidiane', email: 'nouveau@agrisens.io', motDePasse: 'agrisens123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('409 si email déjà utilisé', async () => {
    db.mockImplementation(() => ({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(userFixture),
    }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ nom: 'Diallo', prenom: 'Tidiane', email: 'tidiane@agrisens.io', motDePasse: 'agrisens123' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/auth/me', () => {

  it('401 sans token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 avec token invalide', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.invalide.ici');
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  it('retourne status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
