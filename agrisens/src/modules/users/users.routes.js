const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const db       = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate, authorize('admin'));

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const users = await db('users')
      .select('id','nom','prenom','email','role','telephone','ferme_id','is_active','last_login','created_at')
      .orderBy('created_at', 'desc');
    res.json(users);
  } catch (err) { next(err); }
});

// POST /api/users
router.post('/', async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, role, telephone, ferme_id } = req.body;
    if (!nom || !prenom || !email || !motDePasse)
      return res.status(400).json({ error: 'Champs requis: nom, prenom, email, motDePasse' });
    const existing = await db('users').where({ email }).first();
    if (existing) return res.status(409).json({ error: 'Email deja utilise' });
    const hash = await bcrypt.hash(motDePasse, 12);
    const insert = { nom, prenom, email, mot_de_passe: hash, role: role || 'user' };
    if (telephone) insert.telephone = telephone;
    if (ferme_id)  insert.ferme_id  = ferme_id;
    const [user] = await db('users').insert(insert)
      .returning('id','nom','prenom','email','role','telephone','ferme_id','is_active','created_at');
    res.status(201).json(user);
  } catch (err) { next(err); }
});

// PATCH /api/users/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { role, is_active, nom, prenom, telephone, ferme_id, motDePasse } = req.body;
    if (req.params.id === req.user.id && is_active === false)
      return res.status(400).json({ error: 'Impossible de se desactiver soi-meme' });
    const updates = { updated_at: db.fn.now() };
    if (role       !== undefined) updates.role       = role;
    if (is_active  !== undefined) updates.is_active  = is_active;
    if (nom        !== undefined) updates.nom        = nom;
    if (prenom     !== undefined) updates.prenom     = prenom;
    if (telephone  !== undefined) updates.telephone  = telephone;
    if (ferme_id   !== undefined) updates.ferme_id   = ferme_id || null;
    if (motDePasse)               updates.mot_de_passe = await bcrypt.hash(motDePasse, 12);
    const [user] = await db('users').where({ id: req.params.id })
      .update(updates)
      .returning('id','nom','prenom','email','role','telephone','ferme_id','is_active','created_at');
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) { next(err); }
});

// DELETE /api/users/:id — suppression reelle
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ error: 'Impossible de se supprimer soi-meme' });
    const user = await db('users').where({ id: req.params.id }).first();
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    await db('users').where({ id: req.params.id }).delete();
    res.json({ message: 'Utilisateur supprime' });
  } catch (err) { next(err); }
});

module.exports = router;
