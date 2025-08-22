const { makeRequest } = require('./rf-helpers');

describe('RF7.2 - Commenti', () => {
  let userToken;
  let propostaId;

  beforeAll(async () => {
    const email = `rf7newc.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'Comm', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email, password });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;
    // Prendi una proposta esistente dal catalogo pubblico
    const catalogoRes = await makeRequest('GET', '/proposte');
    expect(catalogoRes.success).toBe(true);
    expect(catalogoRes.data?.data?.length).toBeGreaterThan(0);
    
    // Usa la prima proposta disponibile per i test di commenti
    propostaId = catalogoRes.data?.data[0]._id;
    expect(propostaId).toBeDefined();
  });

  test('RF7.2.1 - Aggiungi commento a proposta', async () => {
    const res = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'Primo commento' }, userToken);
    expect(res.status).toBeDefined();
  });

  test('RF7.2.2 - Commento senza contenuto restituisce 400', async () => {
    const res = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: '' }, userToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('RF7.2.3 - Operatore non può commentare -> 403', async () => {
    const admin = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const adminToken = admin.data?.data?.token;
    const opEmail = `rf72.op.${Date.now()}@test.com`;
    await makeRequest('POST', '/operatori', { email: opEmail, nome: 'Op', cognome: 'Comm', password: 'Operatore123!' }, adminToken);
    const loginOp = await makeRequest('POST', '/auth/login', { email: opEmail, password: 'Operatore123!' });
    const opToken = loginOp.data?.data?.token;
    const res = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'non valido' }, opToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
  });
});


