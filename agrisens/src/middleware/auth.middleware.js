const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

/**
 * Vérifie le JWT et attache req.user
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token manquant' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db('users')
      .where({ id: decoded.id, is_active: true })
      .first();

    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

/**
 * Vérifie que l'utilisateur a le rôle requis
 * @param  {...string} roles
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ error: 'Accès refusé' });
    next();
  };
}

module.exports = { authenticate, authorize };
