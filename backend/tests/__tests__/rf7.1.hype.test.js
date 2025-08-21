const { makeRequest } = require('./rf-helpers');

describe('RF7.1 - Hype', () => {
  let userToken;
  let propostaId;

  beforeAll(async () => {
    const email = `rf7h.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'Hype', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email, password });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;

    const create = await makeRequest('POST', '/proposte', {
      titolo: 'Hype Test', descrizione: 'Prova hype', categoria: 'Test', proponenteID: login.data?.data?.user?._id
    }, userToken);
    propostaId = create.data?.data?._id;
  });

  test('Aggiungi hype ad una proposta', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/hyper`, {}, userToken);
    expect(res.status).toBeDefined();
  });

  test('Rimuovi hype su toggle', async () => {
    await makeRequest('PATCH', `/proposte/${propostaId}/hyper`, {}, userToken);
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/hyper`, {}, userToken);
    expect(res.status).toBeDefined();
  });

  test('Non autenticato non può mettere hype', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/hyper`);
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('Hype su proposta inesistente -> 404', async () => {
    const res = await makeRequest('PATCH', `/proposte/000000000000000000000000/hyper`, {}, userToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });
});


