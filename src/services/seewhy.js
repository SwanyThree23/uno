import axios from 'axios';
import { getConfig, setConfig, saveLog } from '../db/index.js';
import { generateSeeWhyApiKey } from '../utils/crypto.js';

const SEEWHY_BASE_URL = process.env.SEEWHY_BASE_URL || 'https://api.seewhy.live';

const client = axios.create({
  baseURL: SEEWHY_BASE_URL,
  timeout: 10000,
});

// Interceptor to add JWT
client.interceptors.request.use((config) => {
  const jwt = getConfig('SEEWHY_JWT');
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

export const login = async (email, password) => {
  try {
    const res = await client.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    setConfig('SEEWHY_JWT', token);
    setConfig('SEEWHY_USER_ID', user.id);
    return token;
  } catch (error) {
    console.error('SeeWhy Login failed:', error.response?.data || error.message);
    throw error;
  }
};

export const ensureApiKey = async () => {
  let apiKey = getConfig('SEEWHY_API_KEY');
  if (!apiKey) {
    apiKey = generateSeeWhyApiKey();
    // Register API key with SeeWhy if they have an endpoint for it, 
    // or just store it locally if SeeWhy uses it for inbound validation.
    // Based on prompt: "Generate sw_<48hex> API key if not already stored"
    setConfig('SEEWHY_API_KEY', apiKey);
  }
  return apiKey;
};

export const registerWebhook = async (callbackUrl) => {
  try {
    const res = await client.post('/api/webhooks', {
      url: callbackUrl,
      events: ['*'], // All 10 triggers
      description: 'Antigravity Bridge Webhook'
    });
    setConfig('SEEWHY_WEBHOOK_REGISTERED', 'true');
    return res.data;
  } catch (error) {
    console.error('Webhook registration failed:', error.response?.data || error.message);
    // Don't throw, maybe it's already registered
  }
};

export const forwardToSeeWhy = async (userId, payload) => {
  const apiKey = await ensureApiKey();
  try {
    const res = await client.post(`/api/automation/inbound/${userId}`, payload, {
      headers: { 'X-API-Key': apiKey }
    });
    saveLog('GHL_TO_SEEWHY', `/api/automation/inbound/${userId}`, payload, res.status, res.data);
    return res.data;
  } catch (error) {
    saveLog('GHL_TO_SEEWHY', `/api/automation/inbound/${userId}`, payload, error.response?.status || 500, error.response?.data || error.message, error.message);
    throw error;
  }
};
