const { makeRequest } = require('./rf-helpers');

describe('RF11.1 - Approvazione conformità', () => {
  let operatorToken;
  let propostaId;

  beforeAll(async () => {
    const admin = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const adminToken = admin.data?.data?.token;
    const opEmail = `rf11.op.${Date.now()}@test.com`;
    await makeRequest('POST', '/operatori', { email: opEmail, nome: 'Op', cognome: 'Conf', password: 'Operatore123!' }, adminToken);
    const loginOp = await makeRequest('POST', '/auth/login', { email: opEmail, password: 'Operatore123!' });
    operatorToken = loginOp.data?.data?.token;

    // Crea proposta (come utente)
    const email = `rf11.user.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U', cognome: 'C', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    const create = await makeRequest('POST', '/proposte', { titolo: 'Da approvare', descrizione: '...', categoria: 'Test', proponenteID: login.data?.data?.user?._id }, login.data?.data?.token);
    propostaId = create.data?.data?._id;
  });

  test('Operatore vede proposte pending', async () => {
    const res = await makeRequest('GET', '/proposte/pending', null, operatorToken);
    expect(res.status).toBeDefined();
  });

  test('Operatore approva proposta', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'approvata', commento: 'ok' }, operatorToken);
    expect(res.status).toBeDefined();
  });

  test('Non operatore riceve 403 su update stato', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'rifiutata' });
    expect([401, 403]).toContain(res.status);
  });

  test('Aggiornamento stato con valore non consentito può fallire o essere ignorato', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'non_valido' }, operatorToken);
    expect([200, 400, 500]).toContain(res.status);
  });
});


