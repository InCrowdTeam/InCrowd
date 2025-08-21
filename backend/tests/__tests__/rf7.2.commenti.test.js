const { makeRequest } = require('./rf-helpers');

describe('RF7.2 - Commenti', () => {
  let userToken;
  let propostaId;

  beforeAll(async () => {
    const email = `rf7c.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'Comm', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email, password });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;
    const create = await makeRequest('POST', '/proposte', { titolo: 'Comment Test', descrizione: 'Prova commenti', categoria: 'Test', proponenteID: login.data?.data?.user?._id }, userToken);
    propostaId = create.data?.data?._id;
  });

  test('Aggiungi commento a proposta', async () => {
    const res = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'Primo commento' }, userToken);
    expect(res.status).toBeDefined();
  });

  test('Commento senza contenuto restituisce 400', async () => {
    const res = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: '' }, userToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('Recupera commenti pubblici della proposta', async () => {
    const res = await makeRequest('GET', `/proposte/${propostaId}/commenti`);
    expect(res.status).toBeDefined();
  });

  test('Operatore non può commentare -> 403', async () => {
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


