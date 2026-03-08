jest.mock('../../src/config/db', () => {
  const mockDb = jest.fn();
  mockDb.fn = { now: jest.fn(() => new Date()) };
  return mockDb;
});

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
}));

const db = require('../../src/config/db');
const alertesService = require('../../src/modules/alertes/alertes.service');
const { capteurFixture, userFixture } = require('../fixtures');

describe('AlertesService', () => {

  beforeEach(() => jest.clearAllMocks());

  describe('createSeuil()', () => {

    it('crée un seuil valide', async () => {
      const seuilMock = {
        id: 'aaa', capteur_id: capteurFixture.id,
        valeur_max: 30, severite: 'critical', is_active: true,
      };

      db.mockImplementation(() => ({
        where:     jest.fn().mockReturnThis(),
        first:     jest.fn().mockResolvedValue(capteurFixture),
        insert:    jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([seuilMock]),
      }));

      const result = await alertesService.createSeuil({
        capteurId: capteurFixture.id, valeurMax: 30, severite: 'critical',
      }, userFixture.id);

      expect(result.valeur_max).toBe(30);
      expect(result.severite).toBe('critical');
    });

    it('rejette si capteur introuvable', async () => {
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await expect(alertesService.createSeuil({
        capteurId: 'inexistant', valeurMax: 30,
      }, userFixture.id)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('acquitter()', () => {

    it('acquitte une alerte ouverte', async () => {
      const alerte = { id: 'a1', statut: 'ouverte' };
      const acquittee = { ...alerte, statut: 'acquittee', acquitte_par: userFixture.id };

      db.mockImplementation(() => ({
        where:     jest.fn().mockReturnThis(),
        first:     jest.fn().mockResolvedValue(alerte),
        update:    jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([acquittee]),
      }));

      const result = await alertesService.acquitter('a1', userFixture.id);
      expect(result.statut).toBe('acquittee');
    });

    it('rejette si alerte déjà acquittée', async () => {
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'a1', statut: 'acquittee' }),
      }));

      await expect(alertesService.acquitter('a1', userFixture.id))
        .rejects.toMatchObject({ status: 400 });
    });
  });
});
