import db from '../src/db/index.js';

const initialMappings = [
  {
    event: 'stream.started',
    action: 'TAG_CONTACT',
    config: { tag: 'stream-live' }
  },
  {
    event: 'tip.received',
    action: 'CREATE_OPPORTUNITY',
    config: { pipelineId: 'auto', stageId: 'tips', tag: 'tip-received' }
  },
  {
    event: 'ticket.purchased',
    action: 'CREATE_OPPORTUNITY',
    config: { pipelineId: 'auto', stageId: 'sales', tag: 'ticket-buyer' }
  },
  {
    event: 'subscriber.new',
    action: 'UPSERT_CONTACT',
    config: { tag: 'new-subscriber' }
  },
  // Add 6 more to reach 10
  {
    event: 'stream.ended',
    action: 'TAG_CONTACT',
    config: { tag: 'stream-offline' }
  },
  {
    event: 'chat.message',
    action: 'TAG_CONTACT',
    config: { tag: 'active-chatter' }
  },
  {
    event: 'gift.sent',
    action: 'TAG_CONTACT',
    config: { tag: 'gifter' }
  },
  {
    event: 'followed',
    action: 'TAG_CONTACT',
    config: { tag: 'new-follower' }
  },
  {
    event: 'raid.received',
    action: 'TAG_CONTACT',
    config: { tag: 'raid-target' }
  },
  {
    event: 'goal.reached',
    action: 'TAG_CONTACT',
    config: { tag: 'goal-contributor' }
  }
];

console.log('🌱 Seeding mappings...');

const insert = db.prepare(`
  INSERT OR REPLACE INTO mappings (seewhy_event, ghl_action, ghl_config)
  VALUES (?, ?, ?)
`);

for (const m of initialMappings) {
  insert.run(m.event, m.action, JSON.stringify(m.config));
}

console.log('✅ Done!');
process.exit(0);
