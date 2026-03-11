import axios from 'axios';
import crypto from 'crypto';

const BRIDGE_SECRET = 'bridge_1189122a3f56050798e95a881e205fc070ef63f9f7a674ea41213d4cacc70c99';
const WEBHOOK_SECRET = 'test_webhook_secret'; // We'll set this via Admin API first
const BASE_URL = 'http://localhost:4000';

async function runTests() {
  console.log('🧪 Testing Antigravity Endpoints...\n');

  try {
    // 0. Set Webhook Secret and GHL Key for testing
    console.log('0. Setting Test Config...');
    await axios.post(`${BASE_URL}/admin/config`, { 
      key: 'SEEWHY_WEBHOOK_SECRET', 
      value: WEBHOOK_SECRET 
    }, {
      headers: { Authorization: `Bearer ${BRIDGE_SECRET}` }
    });
    await axios.post(`${BASE_URL}/admin/config`, { 
      key: 'GHL_API_KEY', 
      value: 'ghl_test_key_123' 
    }, {
      headers: { Authorization: `Bearer ${BRIDGE_SECRET}` }
    });
    console.log('✅ Test Config set\n');

    // 1. Health Check
    console.log('1. Testing /health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.data.status, '\n');

    // 2. Admin API - Get Mappings
    console.log('2. Testing Admin /admin/mappings...');
    const mappings = await axios.get(`${BASE_URL}/admin/mappings`, {
      headers: { Authorization: `Bearer ${BRIDGE_SECRET}` }
    });
    console.log(`✅ Received ${mappings.data.length} mappings\n`);

    // 3. GHL Trigger (Inbound GHL -> Bridge -> SeeWhy)
    console.log('3. Testing /ghl/trigger...');
    try {
      // This will attempt to call SeeWhy, which should fail (no real creds) but reach service
      await axios.post(`${BASE_URL}/ghl/trigger`, {
        userId: 'test_user_789',
        type: 'ghl_test_event'
      }, {
        headers: { 'X-Bridge-Secret': BRIDGE_SECRET }
      });
    } catch (err) {
      // Expected to fail with 500 if SeeWhy is unreachable, but 401/400 would be bad
      if (err.response?.status === 500) {
        console.log('✅ Trigger reached service (failed SeeWhy call as expected)\n');
      } else {
        console.log('❌ Trigger failed with status:', err.response?.status, err.response?.data, '\n');
      }
    }

    // 4. SeeWhy Webhook (Inbound SeeWhy -> Bridge -> GHL)
    console.log('4. Testing /seewhy/events (Webhook)...');
    const payload = {
      event: 'stream.started',
      data: { email: 'test@example.com', firstName: 'John' }
    };
    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');

    try {
      await axios.post(`${BASE_URL}/seewhy/events`, payload, {
        headers: { 
          'X-SeeWhy-Signature': signature,
          'Content-Type': 'application/json'
        }
      });
    } catch (err) {
      if (err.response?.status === 500) {
        console.log('✅ Webhook reached service (failed GHL call as expected)\n');
      } else {
        console.log('❌ Webhook failed:', err.response?.status, err.response?.data, '\n');
      }
    }

    // 5. Verify Logs
    console.log('5. Verifying Delivery Logs...');
    const logs = await axios.get(`${BASE_URL}/admin/logs`, {
      headers: { Authorization: `Bearer ${BRIDGE_SECRET}` }
    });
    console.log(`✅ Found ${logs.data.length} log entries in DB\n`);

    console.log('🚀 All core tests completed!');
  } catch (error) {
    console.error('💥 Test run failed:', error.message);
    if (error.response) console.error(error.response.data);
  }
}

runTests();
