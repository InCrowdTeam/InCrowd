const { makeRequest } = require('./rf-helpers');

describe('RF2 - Accesso', () => {
  test('Login admin con credenziali locali', async () => {
    const res = await makeRequest('POST', '/auth/login', {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });
    expect(res.success).toBe(true);
    expect(res.data?.data?.token).toBeDefined();
    expect(res.data?.data?.userType).toBe('admin');
  });

  test('Login utente con credenziali non valide', async () => {
    const res = await makeRequest('POST', '/auth/login', {
      email: 'non.esiste@test.com',
      password: 'wrong'
    });
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('Login OAuth Google senza token restituisce 400', async () => {
    const res = await makeRequest('POST', '/auth/google', {});
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('Login con password su account OAuth-only -> 401', async () => {
    const email = `rf2.oauth.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'OAuth', cognome: 'Only', codiceFiscale: 'RSSMRA85C03H501U', email, oauthCode: 'only-oauth'
    });
    const res = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });
});


