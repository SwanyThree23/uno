import axios from 'axios';
import { saveLog } from '../db/index.js';

const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1'; // Or v2 depending on scope

const getHeaders = (apiKey) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
});

export const upsertContact = async (apiKey, contactData) => {
  try {
    const res = await axios.post(`${GHL_BASE_URL}/contacts/`, contactData, {
      headers: getHeaders(apiKey)
    });
    saveLog('SEEWHY_TO_GHL', '/contacts/', contactData, res.status, res.data);
    return res.data;
  } catch (error) {
    saveLog('SEEWHY_TO_GHL', '/contacts/', contactData, error.response?.status || 500, error.response?.data || error.message, error.message);
    throw error;
  }
};

export const addTag = async (apiKey, contactId, tags) => {
  try {
    const res = await axios.post(`${GHL_BASE_URL}/contacts/${contactId}/tags`, { tags }, {
      headers: getHeaders(apiKey)
    });
    saveLog('SEEWHY_TO_GHL', `/contacts/${contactId}/tags`, { tags }, res.status, res.data);
    return res.data;
  } catch (error) {
    saveLog('SEEWHY_TO_GHL', `/contacts/${contactId}/tags`, { tags }, error.response?.status || 500, error.response?.data || error.message, error.message);
    throw error;
  }
};

export const createOpportunity = async (apiKey, pipelineId, stageId, opportunityData) => {
  try {
    const res = await axios.post(`${GHL_BASE_URL}/pipelines/${pipelineId}/stages/${stageId}/opportunities`, opportunityData, {
      headers: getHeaders(apiKey)
    });
    saveLog('SEEWHY_TO_GHL', `/opportunities`, opportunityData, res.status, res.data);
    return res.data;
  } catch (error) {
    saveLog('SEEWHY_TO_GHL', `/opportunities`, opportunityData, error.response?.status || 500, error.response?.data || error.message, error.message);
    throw error;
  }
};
