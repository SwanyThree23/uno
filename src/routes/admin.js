import { Router } from 'express';
import { bridgeAuth } from '../middleware/auth.js';
import db, { setConfig, getConfig } from '../db/index.js';

const router = Router();

router.use(bridgeAuth);

// Config Management
router.get('/config', (req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM config').all();
  // Filter out sensitive info if necessary or keep it for admin
  res.json(rows);
});

router.post('/config', (req, res) => {
  const { key, value } = req.body;
  setConfig(key, value);
  res.json({ success: true });
});

// Mapping Management
router.get('/mappings', (req, res) => {
  const rows = db.prepare('SELECT * FROM mappings').all();
  res.json(rows);
});

router.post('/mappings', (req, res) => {
  const { seewhy_event, ghl_action, ghl_config } = req.body;
  db.prepare(`
    INSERT OR REPLACE INTO mappings (seewhy_event, ghl_action, ghl_config)
    VALUES (?, ?, ?)
  `).run(seewhy_event, ghl_action, JSON.stringify(ghl_config));
  res.json({ success: true });
});

// Logs
router.get('/logs', (req, res) => {
  const limit = req.query.limit || 50;
  const rows = db.prepare('SELECT * FROM logs ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows);
});

export default router;
