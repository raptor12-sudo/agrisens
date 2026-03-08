const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock de la base de données
jest.mock('../../src/config/db', () => {
  const mockDb = jest.fn();
  mockDb.fn = { now: jest.fn(() => new Date()) };
  return mockDb;
});

jest.mock('../../src/utils/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

process.env.JWT_SECRET         = 'test_secret';
process.env.JWT_EXPIRES_IN     = '15m';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const db          = require('../../src/config/db');
const authService = require('../../src/modules/auth/auth.service');
const { userFixture } = require('../fixtures');

describe('AuthService', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  // ─────────────────────────────
  describe('register()', () => {

    it('crée un utilisateur et retourne les tokens', async () => {
      db.mockImplementation((table) => ({
        where:   jest.fn().mockReturnThis(),
        first:   jest.fn().mockResolvedValue(null), // email pas encore pris
        insert:  jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          ...userFixture,
          mot_de_passe: bcrypt.hashSync('agrisens123', 1),
        }]),
        update:  jest.fn().mockReturnThis(),
      }));

      const result = await authService.register({
        nom: 'Diallo', prenom: 'Tidiane',
        email: 'tidiane@agrisens.io', motDePasse: 'agrisens123', role: 'admin',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('mot_de_passe');
      expect(result.user).not.toHaveProperty('refresh_token');
    });

    it('rejette si email déjà utilisé', async () => {
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(userFixture), // email déjà pris
      }));

      await expect(authService.register({
        nom: 'Test', prenom: 'User',
        email: 'tidiane@agrisens.io', motDePasse: 'agrisens123',
      })).rejects.toMatchObject({ message: 'Cet email est déjà utilisé', status: 409 });
    });
  });

  // ─────────────────────────────
  describe('login()', () => {

    it('retourne les tokens avec credentials valides', async () => {
      const hash = await bcrypt.hash('agrisens123', 1);
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...userFixture, mot_de_passe: hash }),
        update: jest.fn().mockReturnThis(),
      }));

      const result = await authService.login({
        email: 'tidiane@agrisens.io', motDePasse: 'agrisens123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('tidiane@agrisens.io');
    });

    it('rejette avec mauvais mot de passe', async () => {
      const hash = await bcrypt.hash('autremdp', 1);
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...userFixture, mot_de_passe: hash }),
      }));

      await expect(authService.login({
        email: 'tidiane@agrisens.io', motDePasse: 'mauvais',
      })).rejects.toMatchObject({ status: 401 });
    });

    it('rejette si utilisateur inactif', async () => {
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null), // is_active: false → null
      }));

      await expect(authService.login({
        email: 'inactif@agrisens.io', motDePasse: 'agrisens123',
      })).rejects.toMatchObject({ status: 401 });
    });
  });

  // ─────────────────────────────
  describe('refresh()', () => {

    it('génère un nouveau accessToken avec refresh token valide', async () => {
      const token = jwt.sign({ id: userFixture.id }, 'test_refresh_secret', { expiresIn: '7d' });

      db.mockImplementation(() => ({
        where:  jest.fn().mockReturnThis(),
        first:  jest.fn().mockResolvedValue({ ...userFixture, refresh_token: token }),
        update: jest.fn().mockReturnThis(),
      }));

      const result = await authService.refresh({ refreshToken: token });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('rejette un refresh token expiré', async () => {
      const expiredToken = jwt.sign({ id: userFixture.id }, 'test_refresh_secret', { expiresIn: '-1s' });

      await expect(authService.refresh({ refreshToken: expiredToken }))
        .rejects.toMatchObject({ status: 401 });
    });
  });
});
