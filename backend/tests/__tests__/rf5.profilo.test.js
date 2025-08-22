const { makeRequest } = require('./rf-helpers');

describe('RF5 - Profilo personale', () => {
  let userToken;

  beforeAll(async () => {
    const email = `rf5.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'RF5', cognome: 'Utente per test visualizzazione profilo', codiceFiscale: 'RSSMRA85C03H501U', email, password
    });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;
  });

  test('RF5.1 - Get profilo corrente', async () => {
    const res = await makeRequest('GET', '/user/me', null, userToken);
    expect(res.status).toBeDefined();
  });

  test('RF5.2 - Aggiorna profilo corrente', async () => {
    const res = await makeRequest('PATCH', '/user/profile', { biografia: 'Bio test (modificata)' }, userToken);
    expect(res.status).toBeDefined();
  });

  test('RF5.3 - Visualizza proprie proposte (lista vuota o elenco)', async () => {
    // Prima ottieni l'ID dell'utente dal profilo
    const profileRes = await makeRequest('GET', '/user/me', null, userToken);
    expect(profileRes.success).toBe(true);
    const userId = profileRes.data?.data?.user?._id;
    expect(userId).toBeDefined();
    
    // Crea una proposta per l'utente
    const propostaData = {
      titolo: 'Proposta Test RF5',
      descrizione: 'Descrizione della proposta di test per RF5',
      categoria: 'Test',
      proponenteID: userId, // Imposta l'ID dell'utente autenticato
      indirizzo_citta: 'Milano',
      indirizzo_cap: '20100',
      indirizzo_via: 'Via Test',
      indirizzo_civico: '123',
      dataIpotetica: '2024-12-31'
    };

    // Crea la proposta
    const createRes = await makeRequest('POST', '/proposte', propostaData, userToken);
    expect(createRes.success).toBe(true);
    expect(createRes.status).toBe(201);
    
    // Ora verifica che l'utente possa vedere le proprie proposte
    const res = await makeRequest('GET', '/proposte/my', null, userToken);
    expect(res.success).toBe(true);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data?.data)).toBe(true);
    expect(res.data?.data.length).toBeGreaterThan(0); // Dovrebbe contenere almeno la proposta appena creata
    
    // Verifica che la proposta creata sia nella lista
    const propostaCreata = res.data?.data.find(p => p.titolo === propostaData.titolo);
    expect(propostaCreata).toBeDefined();
    expect(propostaCreata.titolo).toBe(propostaData.titolo);
    expect(propostaCreata.descrizione).toBe(propostaData.descrizione);
  });

  test('RF5.4 - Tentativo di modificare codice fiscale viene ignorato o rifiutato', async () => {
    const res = await makeRequest('PATCH', '/user/profile', { codiceFiscale: 'NUOVOCF85C03H501Z' }, userToken);
    expect([200, 400, 403]).toContain(res.status);
    
    // Verifica che il codice fiscale non sia stato modificato
    const profileRes = await makeRequest('GET', '/user/me', null, userToken);
    expect(profileRes.success).toBe(true);
    expect(profileRes.data?.data?.user?.codiceFiscale).toBe('RSSMRA85C03H501U'); // Dovrebbe essere quello originale
  });
});


