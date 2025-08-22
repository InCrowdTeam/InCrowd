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

  test('RF10.1 - Operatore vede statistiche complete e valide', async () => {
    const res = await makeRequest('GET', '/operatori/stats', null, operatorToken);
    
    // Verifica che la richiesta sia andata a buon fine
    expect(res.success).toBe(true);
    expect(res.status).toBe(200);
    
    // Verifica che i dati siano presenti
    expect(res.data?.data).toBeDefined();
    
    // Verifica che tutti i campi chiave siano presenti
    expect(res.data?.data?.proposteApprovate).toBeDefined();
    expect(res.data?.data?.utentiTotali).toBeDefined();
    
    // Verifica che i valori siano numeri validi
    expect(typeof res.data?.data?.proposteApprovate).toBe('number');
    expect(typeof res.data?.data?.utentiTotali).toBe('number');
    
    // Verifica che i valori siano non negativi
    expect(res.data?.data?.proposteApprovate).toBeGreaterThanOrEqual(0);
    expect(res.data?.data?.utentiTotali).toBeGreaterThanOrEqual(0);
  });

  test('RF10.2 - Non autenticato non vede statistiche', async () => {
    const res = await makeRequest('GET', '/operatori/stats');
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('RF10.3 - Utente non operatore riceve 403', async () => {
    const email = `rf10.user.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U', cognome: 'X', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    const res = await makeRequest('GET', '/operatori/stats', null, login.data?.data?.token);
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
  });
});


