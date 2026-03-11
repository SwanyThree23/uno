import { getConfig } from '../src/db/index.js';

const secret = getConfig('BRIDGE_SECRET');
if (secret) {
  console.log(`🔑 Your ANTIGRAVITY BRIDGE_SECRET is: ${secret}`);
  console.log('Use this in the "Authorization: Bearer <secret>" header for Admin API calls.');
  console.log('Or in the "X-Bridge-Secret" header for GHL triggers.');
} else {
  console.log('❌ BRIDGE_SECRET not found in DB. Run the app first to generate it.');
}
process.exit(0);
