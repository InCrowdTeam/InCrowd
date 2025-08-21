const { makeRequest } = require('./rf-helpers');

describe('RF12 - Gestione operatore', () => {
  let adminToken;
  let createdId;

  beforeAll(async () => {
    const login = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    adminToken = login.data?.data?.token;
  });

  test('Admin crea operatore', async () => {
    const email = `rf12.${Date.now()}@incrowd.com`;
    const res = await makeRequest('POST', '/operatori', { email, nome: 'Operatore', cognome: 'RF12', password: 'Operatore123!' }, adminToken);
    createdId = res.data?.data?._id;
    expect([200, 201]).toContain(res.status);
  });

  test('Admin lista operatori', async () => {
    const res = await makeRequest('GET', '/operatori', null, adminToken);
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data?.data)).toBe(true);
  });

  test('Admin elimina operatore', async () => {
    const res = await makeRequest('DELETE', `/operatori/${createdId}`, null, adminToken);
    expect([200, 404]).toContain(res.status);
  });

  test('Creazione operatore con email duplicata -> 409', async () => {
    const email = `rf12.dup.${Date.now()}@incrowd.com`;
    await makeRequest('POST', '/operatori', { email, nome: 'Op', cognome: 'Dup', password: 'Operatore123!' }, adminToken);
    const res = await makeRequest('POST', '/operatori', { email, nome: 'Op', cognome: 'Dup', password: 'Operatore123!' }, adminToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(409);
  });
});


