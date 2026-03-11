import { Router } from 'express';
import { ghlTriggerAuth } from '../middleware/auth.js';
import { forwardToSeeWhy } from '../services/seewhy.js';
import { getConfig } from '../db/index.js';

const router = Router();

router.post('/trigger', ghlTriggerAuth, async (req, res) => {
  const { userId, ...payload } = req.body;
  
  // Use user ID from body if provided, else fallback to stored ID
  const effectiveUserId = userId || getConfig('SEEWHY_USER_ID');

  if (!effectiveUserId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    const result = await forwardToSeeWhy(effectiveUserId, payload);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
