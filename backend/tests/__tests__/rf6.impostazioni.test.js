const { makeRequest } = require('./rf-helpers');

describe('RF6 - Impostazioni', () => {
  let tokenWithOAuthOnly;
  let tokenWithPassword;
  let userId;

  beforeAll(async () => {
    const email1 = `rf6.oauth.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'OAuth', cognome: 'Only', codiceFiscale: 'RSSMRA85C03H501U', email: email1, oauthCode: 'oauth-only'
    });
    const login1 = await makeRequest('POST', '/auth/login', { email: email1, oauthCode: 'oauth-only' });
    tokenWithOAuthOnly = login1.data?.data?.token;

    const email2 = `rf6.pass.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'Pass', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email: email2, password: 'Password123!'
    });
    const login2 = await makeRequest('POST', '/auth/login', { email: email2, password: 'Password123!' });
    tokenWithPassword = login2.data?.data?.token;
  });

  test('Utente OAuth-only può impostare una password', async () => {
    const res = await makeRequest('PATCH', '/auth/password', { newPassword: 'NuovaPass123!' }, tokenWithOAuthOnly);
    expect([200, 201]).toContain(res.status);
  });

  test('Utente con password non può reimpostarla tramite endpoint di set', async () => {
    const res = await makeRequest('PATCH', '/auth/password', { newPassword: 'AltraPass123!' }, tokenWithPassword);
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('Eliminazione account corrente', async () => {
    const res = await makeRequest('DELETE', '/user/account', null, tokenWithPassword);
    expect([200, 404]).toContain(res.status);
  });

  test('Password nuova non valida -> 400', async () => {
    const res = await makeRequest('PATCH', '/auth/password', { newPassword: 'short' }, tokenWithOAuthOnly);
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });
});


