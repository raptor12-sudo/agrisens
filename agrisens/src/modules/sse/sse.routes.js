const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const db      = require('../../config/db');

const clients = new Set();

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => {
    try { res.write(msg); } catch { clients.delete(res); }
  });
}

router.get('/', async (req, res) => {
  // Auth via Bearer header OU query param token
  let token = req.query.token;
  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) token = header.split(' ')[1];
  }

  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await db('users').where({ id: decoded.id, is_active: true }).first();
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  const ping = setInterval(() => {
    try { res.write('event: ping\ndata: {}\n\n'); } catch { clients.delete(res); }
  }, 25000);

  clients.add(res);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
});

module.exports = { router, broadcast };
