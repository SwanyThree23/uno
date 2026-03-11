import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';

import { getConfig, setConfig } from './db/index.js';
import { generateBridgeSecret } from './utils/crypto.js';
import { login, ensureApiKey, registerWebhook } from './services/seewhy.js';

import ghlRoutes from './routes/ghl.js';
import seewhyRoutes from './routes/seewhy.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/ghl', ghlRoutes);
app.use('/seewhy', seewhyRoutes);
app.use('/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Bootstrap Sequence
async function bootstrap() {
  console.log('🚀 Starting Antigravity Bootstrap Sequence...');

  // 1. Ensure Bridge Secret
  let bridgeSecret = getConfig('BRIDGE_SECRET');
  if (!bridgeSecret) {
    bridgeSecret = generateBridgeSecret();
    setConfig('BRIDGE_SECRET', bridgeSecret);
    console.log('✨ Generated new BRIDGE_SECRET');
  }

  // 2. SeeWhy Login & Session Management
  const seewhyEmail = process.env.SEEWHY_EMAIL;
  const seewhyPassword = process.env.SEEWHY_PASSWORD;

  if (seewhyEmail && seewhyPassword) {
    try {
      await login(seewhyEmail, seewhyPassword);
      console.log('✅ Logged into SeeWhy LIVE');
    } catch (err) {
      console.error('❌ SeeWhy Login failed during bootstrap');
    }
  } else {
    console.warn('⚠️ Missing SEEWHY_EMAIL/PASSWORD in .env. Login skipped.');
  }

  // 3. Ensure API Key
  await ensureApiKey();
  console.log('✅ SeeWhy API Key verified');

  // 4. Register Outbound Webhook (if URL provided)
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    await registerWebhook(`${appUrl}/seewhy/events`);
    console.log(`✅ Webhook registered at ${appUrl}/seewhy/events`);
  }

  // 5. Schedule JWT Refresh (every 23 hours)
  cron.schedule('0 */23 * * *', async () => {
    console.log('⏳ Refreshing SeeWhy JWT...');
    if (seewhyEmail && seewhyPassword) {
      try {
        await login(seewhyEmail, seewhyPassword);
        console.log('✅ JWT Refreshed');
      } catch (err) {
        console.error('❌ JWT Refresh failed');
      }
    }
  });

  console.log('🏁 Bootstrap Sequence Complete');
}

app.listen(PORT, async () => {
  console.log(`📡 Antigravity Bridge running on port ${PORT}`);
  await bootstrap();
});
