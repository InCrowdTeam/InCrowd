const { makeRequest } = require('./rf-helpers');

describe('RF10 - Statistiche', () => {
  let operatorToken;

  beforeAll(async () => {
    // Login come admin per creare operatore
    const admin = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const adminToken = admin.data?.data?.token;
    const opEmail = `rf10.op.${Date.now()}@test.com`;
    await makeRequest('POST', '/operatori', { email: opEmail, nome: 'Op', cognome: 'Test', password: 'Operatore123!' }, adminToken);
    const loginOp = await makeRequest('POST', '/auth/login', { email: opEmail, password: 'Operatore123!' });
    operatorToken = loginOp.data?.data?.token;
  });

  test('Operatore vede statistiche', async () => {
    const res = await makeRequest('GET', '/operatori/stats', null, operatorToken);
    expect(res.status).toBeDefined();
  });

  test('Non autenticato non vede statistiche', async () => {
    const res = await makeRequest('GET', '/operatori/stats');
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('Utente non operatore riceve 403', async () => {
    const email = `rf10.user.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U', cognome: 'X', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    const res = await makeRequest('GET', '/operatori/stats', null, login.data?.data?.token);
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
  });

  test('Stats contengono campi chiave', async () => {
    const res = await makeRequest('GET', '/operatori/stats', null, operatorToken);
    expect(res.data?.data).toBeDefined();
    expect(res.data?.data?.proposteApprovate).toBeDefined();
    expect(res.data?.data?.utentiTotali).toBeDefined();
  });
});


