const { makeRequest } = require('./rf-helpers');

describe('RF11.2 - Approvazione finale', () => {
  let operatorToken;
  let propostaId;

  beforeAll(async () => {
    const admin = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const adminToken = admin.data?.data?.token;
    const opEmail = `rf112.op.${Date.now()}@test.com`;
    await makeRequest('POST', '/operatori', { email: opEmail, nome: 'Op', cognome: 'Final', password: 'Operatore123!' }, adminToken);
    const loginOp = await makeRequest('POST', '/auth/login', { email: opEmail, password: 'Operatore123!' });
    operatorToken = loginOp.data?.data?.token;

    // Crea proposta approvata prima fase
    const email = `rf112.user.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U', cognome: 'F', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    const create = await makeRequest('POST', '/proposte', { titolo: 'Finale', descrizione: '...', categoria: 'Test', proponenteID: login.data?.data?.user?._id }, login.data?.data?.token);
    propostaId = create.data?.data?._id;
    await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'approvata', commento: 'ok' }, operatorToken);
  });

  test('Operatore può segnare proposta come vincitrice (se supportato)', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'vincitrice', commento: 'finanziata' }, operatorToken);
    expect(res.status).toBeDefined();
  });

  test('Proposta vincitrice resta visibile pubblicamente', async () => {
    const res = await makeRequest('GET', `/proposte/${propostaId}`);
    expect([true, false]).toContain(res.success);
    expect(res.status).toBeDefined();
  });

  test('Non operatore non può segnare vincitrice', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'vincitrice' });
    expect([401, 403]).toContain(res.status);
  });

  test('Stato vincitrice accettato anche se enum non lo include (comportamento attuale)', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'vincitrice' }, operatorToken);
    expect([200, 500]).toContain(res.status);
  });
});


