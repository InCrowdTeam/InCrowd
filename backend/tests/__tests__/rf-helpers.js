const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';

const makeRequest = async (method, endpoint, data = null, token = null, headers = {}) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { 'Content-Type': 'application/json', ...headers }
  };
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (data) config.data = data;
  try {
    const res = await axios(config);
    return { success: true, data: res.data, status: res.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

const loginAs = async (creds) => {
  return makeRequest('POST', '/auth/login', creds);
};

module.exports = {
  BASE_URL,
  makeRequest,
  loginAs
};


