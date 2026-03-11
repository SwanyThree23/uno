import { Router } from 'express';
import { seewhyWebhookAuth } from '../middleware/auth.js';
import { addTag, upsertContact, createOpportunity } from '../services/ghl.js';
import db, { getConfig } from '../db/index.js';

const router = Router();

router.post('/events', seewhyWebhookAuth, async (req, res) => {
  const { event, data } = req.body;
  const ghlApiKey = getConfig('GHL_API_KEY');

  if (!ghlApiKey) {
    return res.status(500).json({ error: 'GHL API Key not configured' });
  }

  // Get mapping for this event
  const mapping = db.prepare('SELECT ghl_action, ghl_config FROM mappings WHERE seewhy_event = ? AND active = 1').get(event);

  if (!mapping) {
    console.log(`No active mapping for event: ${event}`);
    return res.json({ status: 'ignored' });
  }

  const { ghl_action, ghl_config } = mapping;
  const config = JSON.parse(ghl_config || '{}');

  try {
    switch (ghl_action) {
      case 'TAG_CONTACT':
        if (data.contactId || data.email) {
          // Logic to find contact by email if ID not present
          const contactId = data.contactId || await findContactByEmail(ghlApiKey, data.email);
          await addTag(ghlApiKey, contactId, [config.tag]);
        }
        break;
      
      case 'UPSERT_CONTACT':
        await upsertContact(ghlApiKey, {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          tags: [config.tag]
        });
        break;

      case 'CREATE_OPPORTUNITY':
        if (data.email) {
          const contact = await upsertContact(ghlApiKey, {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            tags: [config.tag]
          });
          const contactId = contact.id || contact.contact?.id;
          await createOpportunity(ghlApiKey, config.pipelineId, config.stageId, {
            name: `${data.firstName || 'User'} - ${event}`,
            status: 'open',
            contactId
          });
        }
        break;

      // ... Add more cases for the 10 triggers ...
      
      default:
        console.warn(`Action ${ghl_action} not implemented`);
    }

    res.json({ status: 'success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function findContactByEmail(apiKey, email) {
  // Placeholder for contact lookup logic
  return null;
}

export default router;
