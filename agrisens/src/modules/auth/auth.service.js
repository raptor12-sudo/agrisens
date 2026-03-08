const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../../config/db');
const logger = require('../../utils/logger');

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

function sanitizeUser(user) {
  const { mot_de_passe, refresh_token, ...safe } = user;
  return safe;
}

async function register({ nom, prenom, email, motDePasse, role }) {
  const existing = await db('users').where({ email }).first();
  if (existing) {
    const err = new Error('Cet email est déjà utilisé');
    err.status = 409;
    throw err;
  }

  const hash = await bcrypt.hash(motDePasse, 12);

  const [user] = await db('users')
    .insert({ nom, prenom, email, mot_de_passe: hash, role: role || 'fermier' })
    .returning('*');

  logger.info(`Nouvel utilisateur créé : ${email} [${user.role}]`);

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await db('users').where({ id: user.id }).update({ refresh_token: refreshToken });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

async function login({ email, motDePasse }) {
  const user = await db('users').where({ email, is_active: true }).first();

  if (!user) {
    const err = new Error('Email ou mot de passe incorrect');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(motDePasse, user.mot_de_passe);
  if (!valid) {
    const err = new Error('Email ou mot de passe incorrect');
    err.status = 401;
    throw err;
  }

  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await db('users').where({ id: user.id }).update({
    refresh_token: refreshToken,
    last_login:    db.fn.now(),
  });

  logger.info(`Connexion réussie : ${email}`);
  return { user: sanitizeUser(user), accessToken, refreshToken };
}

async function refresh({ refreshToken }) {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Refresh token invalide ou expiré');
    err.status = 401;
    throw err;
  }

  const user = await db('users')
    .where({ id: decoded.id, refresh_token: refreshToken, is_active: true })
    .first();

  if (!user) {
    const err = new Error('Refresh token révoqué');
    err.status = 401;
    throw err;
  }

  const accessToken     = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await db('users').where({ id: user.id }).update({ refresh_token: newRefreshToken });
  return { accessToken, refreshToken: newRefreshToken };
}

async function logout(userId) {
  await db('users').where({ id: userId }).update({ refresh_token: null });
  logger.info(`Déconnexion : userId ${userId}`);
}

async function me(userId) {
  const user = await db('users').where({ id: userId, is_active: true }).first();
  if (!user) {
    const err = new Error('Utilisateur introuvable');
    err.status = 404;
    throw err;
  }
  return sanitizeUser(user);
}

module.exports = { register, login, refresh, logout, me };
