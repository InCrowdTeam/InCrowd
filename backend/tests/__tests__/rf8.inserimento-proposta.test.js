const { makeRequest } = require('./rf-helpers');

// Helper per confrontare le date ignorando il timestamp
const compareDateOnly = (date1, date2) => {
  const date1Only = new Date(date1).toISOString().split('T')[0];
  const date2Only = new Date(date2).toISOString().split('T')[0];
  return date1Only === date2Only;
};

describe('RF8 - Inserimento proposta', () => {
  let userToken;
  let userId;
  let createdPropostaId;

  beforeAll(async () => {
    const email = `rf8.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'Prop', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email, password });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;
    userId = login.data?.data?.user?._id;

    // Verifica che l'utente sia stato creato correttamente
    expect(userToken).toBeDefined();
    expect(userId).toBeDefined();
  });

  test('Creazione proposta valida', async () => {
    const propostaData = {
      titolo: 'Nuova Proposta Test',
      descrizione: 'Descrizione della proposta di test',
      categoria: 'Test',
      proponenteID: userId,
      indirizzo_citta: 'Milano',
      indirizzo_cap: '20100',
      indirizzo_via: 'Via Roma',
      indirizzo_civico: '42',
      dataIpotetica: '2024-12-31'
    };

    const res = await makeRequest('POST', '/proposte', propostaData, userToken);

    // Verifica che la richiesta sia andata a buon fine
    expect(res.success).toBe(true);
    expect(res.status).toBe(201);

    // Verifica che la risposta contenga i dati della proposta
    expect(res.data?.data).toBeDefined();
    expect(res.data?.data._id).toBeDefined();
    expect(res.data?.data.titolo).toBe(propostaData.titolo);
    expect(res.data?.data.descrizione).toBe(propostaData.descrizione);
    expect(res.data?.data.categoria).toBe(propostaData.categoria);
    expect(res.data?.data.proponenteID).toBe(userId);
    expect(res.data?.data.stato?.stato).toBe('in_approvazione');
    expect(res.data?.data.luogo?.citta).toBe(propostaData.indirizzo_citta);
    expect(res.data?.data.luogo?.cap).toBe(propostaData.indirizzo_cap);
    expect(res.data?.data.luogo?.via).toBe(propostaData.indirizzo_via);
    expect(res.data?.data.luogo?.civico).toBe(propostaData.indirizzo_civico);
    // Confronta le date ignorando il timestamp
    expect(compareDateOnly(res.data?.data.dataIpotetica, propostaData.dataIpotetica)).toBe(true);

    // Salva l'ID per i test successivi
    createdPropostaId = res.data?.data._id;

    // Verifica che la proposta sia effettivamente nel database
    // NOTA: Ora solo il proprietario può vedere proposte non approvate
    const getRes = await makeRequest('GET', `/proposte/${createdPropostaId}`, null, userToken);
    expect(getRes.success).toBe(true);
    expect(getRes.data?.data._id).toBe(createdPropostaId);
  });

  test('Creazione proposta senza descrizione -> 400', async () => {
    const res = await makeRequest('POST', '/proposte', {
      titolo: 'Senza descrizione',
      proponenteID: userId
    }, userToken);

    expect(res.success).toBe(false);
    expect([400, 500]).toContain(res.status);
  });

  test('Non autenticato non può creare proposta', async () => {
    const res = await makeRequest('POST', '/proposte', {
      titolo: 'X',
      descrizione: 'Y',
      categoria: 'Z',
      proponenteID: userId
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('Creazione proposta con categoria mancante ma campi minimi OK', async () => {
    const propostaData = {
      titolo: 'Proposta Minima',
      descrizione: 'Solo campi minimi richiesti',
      proponenteID: userId,
      indirizzo_citta: 'Roma',
      indirizzo_cap: '00100',
      indirizzo_via: 'Via del Corso',
      indirizzo_civico: '15',
      dataIpotetica: '2024-11-30'
    };

    const res = await makeRequest('POST', '/proposte', propostaData, userToken);

    expect(res.success).toBe(true);
    expect(res.status).toBe(201);

    // Verifica che la proposta sia stata creata correttamente
    expect(res.data?.data._id).toBeDefined();
    expect(res.data?.data.titolo).toBe(propostaData.titolo);
    expect(res.data?.data.descrizione).toBe(propostaData.descrizione);
    expect(res.data?.data.proponenteID).toBe(userId);
    expect(res.data?.data.stato?.stato).toBe('in_approvazione');
    expect(res.data?.data.luogo?.citta).toBe(propostaData.indirizzo_citta);
    expect(res.data?.data.luogo?.cap).toBe(propostaData.indirizzo_cap);
    expect(res.data?.data.luogo?.via).toBe(propostaData.indirizzo_via);
    expect(res.data?.data.luogo?.civico).toBe(propostaData.indirizzo_civico);
    // Confronta le date ignorando il timestamp
    expect(compareDateOnly(res.data?.data.dataIpotetica, propostaData.dataIpotetica)).toBe(true);
  });

  test('Verifica proposta creata nel database (proprietario)', async () => {
    // Questo test verifica che la prima proposta sia ancora nel database
    // Ora richiede autenticazione del proprietario per proposte non approvate
    if (createdPropostaId) {
      const res = await makeRequest('GET', `/proposte/${createdPropostaId}`, null, userToken);
      expect(res.success).toBe(true);
      expect(res.data?.data._id).toBe(createdPropostaId);
      expect(res.data?.data.titolo).toBe('Nuova Proposta Test');
      expect(res.data?.data.descrizione).toBe('Descrizione della proposta di test');
      expect(res.data?.data.categoria).toBe('Test');
      expect(res.data?.data.proponenteID).toBe(userId);
      expect(res.data?.data.luogo?.citta).toBe('Milano');
      expect(res.data?.data.luogo?.cap).toBe('20100');
      expect(res.data?.data.luogo?.via).toBe('Via Roma');
      expect(res.data?.data.luogo?.civico).toBe('42');
      // Confronta le date ignorando il timestamp
      expect(compareDateOnly(res.data?.data.dataIpotetica, '2024-12-31')).toBe(true);
      expect(res.data?.data.stato?.stato).toBe('in_approvazione');
    }
  });

  test('Proposta non approvata non è visibile pubblicamente', async () => {
    if (createdPropostaId) {
      // Test senza token (utente non autenticato)
      const res = await makeRequest('GET', `/proposte/${createdPropostaId}`);
      expect(res.success).toBe(false);
      expect(res.status).toBe(403);
      expect(res.error?.message).toBe('Accesso negato: proposta non ancora approvata o rifiutata');
    }
  });

  test('Proprietario può vedere la propria proposta non approvata', async () => {
    if (createdPropostaId) {
      // Test con token del proprietario
      const res = await makeRequest('GET', `/proposte/${createdPropostaId}`, null, userToken);
      expect(res.success).toBe(true);
      expect(res.status).toBe(200);
      expect(res.data?.data._id).toBe(createdPropostaId);
      expect(res.data?.data.titolo).toBe('Nuova Proposta Test');
    }
  });

  test('Utente non proprietario non può vedere proposta non approvata', async () => {
    if (createdPropostaId) {
      // Crea un altro utente
      const otherEmail = `rf8.other.${Date.now()}@test.com`;
      const otherPassword = 'Password123!';
      await makeRequest('POST', '/user', {
        user_type: 'privato',
        nome: 'Other',
        cognome: 'User',
        codiceFiscale: 'RSSMRA85C03H501V',
        email: otherEmail,
        password: otherPassword
      });
      const otherLogin = await makeRequest('POST', '/auth/login', { email: otherEmail, password: otherPassword });
      const otherToken = otherLogin.data?.data?.token;

      // Test con token di altro utente
      const res = await makeRequest('GET', `/proposte/${createdPropostaId}`, null, otherToken);
      expect(res.success).toBe(false);
      expect(res.status).toBe(403);
      expect(res.error?.message).toBe('Accesso negato: proposta non ancora approvata o rifiutata');
    }
  });
});


