const schemas = require('../../src/modules/auth/auth.validation');

describe('Auth Validation Schemas', () => {

  describe('register', () => {
    const valid = { nom: 'Diallo', prenom: 'Tidiane', email: 'tidiane@agrisens.io', motDePasse: 'agrisens123' };

    it('valide un body correct', () => {
      const { error } = schemas.register.validate(valid);
      expect(error).toBeUndefined();
    });

    it('rejette un email invalide', () => {
      const { error } = schemas.register.validate({ ...valid, email: 'pas-un-email' });
      expect(error).toBeDefined();
    });

    it('rejette un mot de passe trop court (< 8 chars)', () => {
      const { error } = schemas.register.validate({ ...valid, motDePasse: 'court' });
      expect(error).toBeDefined();
    });

    it('rejette un rôle invalide', () => {
      const { error } = schemas.register.validate({ ...valid, role: 'superadmin' });
      expect(error).toBeDefined();
    });

    it('accepte tous les rôles valides', () => {
      for (const role of ['admin','fermier','technicien','observateur']) {
        const { error } = schemas.register.validate({ ...valid, role });
        expect(error).toBeUndefined();
      }
    });
  });

  describe('login', () => {
    it('valide un body correct', () => {
      const { error } = schemas.login.validate({ email: 'a@b.io', motDePasse: 'mdp123' });
      expect(error).toBeUndefined();
    });

    it('rejette sans email', () => {
      const { error } = schemas.login.validate({ motDePasse: 'mdp123' });
      expect(error).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('valide avec refreshToken', () => {
      const { error } = schemas.refresh.validate({ refreshToken: 'un.token.jwt' });
      expect(error).toBeUndefined();
    });

    it('rejette sans refreshToken', () => {
      const { error } = schemas.refresh.validate({});
      expect(error).toBeDefined();
    });
  });
});
