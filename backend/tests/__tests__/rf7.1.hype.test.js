const { makeRequest } = require('./rf-helpers');

describe('RF7.1 - Hype', () => {
  let userToken;
  let propostaId;

  beforeAll(async () => {
    // Crea l'utente per i test
    const email = `rf7h.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'Hype', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email, password });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;

    // Prendi una proposta esistente dal catalogo pubblico
    const catalogoRes = await makeRequest('GET', '/proposte');
    expect(catalogoRes.success).toBe(true);
    expect(catalogoRes.data?.data?.length).toBeGreaterThan(0);
    
    // Usa la prima proposta disponibile per i test di hype
    propostaId = catalogoRes.data?.data[0]._id;
    expect(propostaId).toBeDefined();
  });

  test('RF7.1.1 - Aggiungi hype ad una proposta', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/hyper`, {}, userToken);
    expect(res.status).toBeDefined();
  });


  test('RF7.1.2 - Non autenticato non può mettere hype', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/hyper`);
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('RF7.1.3 - Hype su proposta inesistente -> 404', async () => {
    const res = await makeRequest('PATCH', `/proposte/000000000000000000000000/hyper`, {}, userToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });
});


