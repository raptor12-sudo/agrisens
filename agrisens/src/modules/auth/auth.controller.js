const authService = require('./auth.service');
const schemas     = require('./auth.validation');

async function register(req, res, next) {
  try {
    const { error, value } = schemas.register.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const result = await authService.register(value);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { error, value } = schemas.login.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const result = await authService.login(value);
    res.json(result);
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { error, value } = schemas.refresh.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const result = await authService.refresh(value);
    res.json(result);
  } catch (err) { next(err); }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.user.id);
    res.json({ message: 'Déconnexion réussie' });
  } catch (err) { next(err); }
}

async function me(req, res, next) {
  try {
    const user = await authService.me(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
}

module.exports = { register, login, refresh, logout, me };
