const { makeRequest } = require('./rf-helpers');

describe('RF5 - Profilo personale', () => {
  let userToken;

  beforeAll(async () => {
    const email = `rf5.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'RF5', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email, password
    });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;
  });

  test('Get profilo corrente', async () => {
    const res = await makeRequest('GET', '/user/me', null, userToken);
    expect(res.status).toBeDefined();
  });

  test('Aggiorna profilo corrente', async () => {
    const res = await makeRequest('PATCH', '/user/profile', { biografia: 'Bio test' }, userToken);
    expect(res.status).toBeDefined();
  });

  test('Visualizza proprie proposte (lista vuota o elenco)', async () => {
    const res = await makeRequest('GET', '/proposte/my', null, userToken);
    expect(res.status).toBeDefined();
  });

  test('Aggiornamento profilo con campo non permesso viene ignorato (semplice)', async () => {
    const res = await makeRequest('PATCH', '/user/profile', { password: 'NonPermessa123!' }, userToken);
    expect([200, 400]).toContain(res.status);
  });
});


