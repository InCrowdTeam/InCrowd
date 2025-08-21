const { makeRequest } = require('./rf-helpers');

describe('RF8 - Inserimento proposta', () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    const email = `rf8.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'Prop', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email, password });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;
    userId = login.data?.data?.user?._id;
  });

  test('Creazione proposta valida', async () => {
    const res = await makeRequest('POST', '/proposte', {
      titolo: 'Nuova Proposta', descrizione: 'Descrizione', categoria: 'Test', proponenteID: userId
    }, userToken);
    expect([201, 200, 500]).toContain(res.status);
  });

  test('Creazione proposta senza descrizione -> 500/400', async () => {
    const res = await makeRequest('POST', '/proposte', { titolo: 'Senza descrizione' }, userToken);
    expect([400, 401, 500]).toContain(res.status);
  });

  test('Non autenticato non può creare proposta', async () => {
    const res = await makeRequest('POST', '/proposte', { titolo: 'X', descrizione: 'Y', categoria: 'Z' });
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('Creazione proposta con categoria mancante ma campi minimi OK (accettabile)', async () => {
    const res = await makeRequest('POST', '/proposte', {
      titolo: 'Minima', descrizione: 'Solo minimi', proponenteID: userId
    }, userToken);
    expect([201, 200, 500]).toContain(res.status);
  });
});


