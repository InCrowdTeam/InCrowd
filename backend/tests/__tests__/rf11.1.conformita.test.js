const { makeRequest } = require('./rf-helpers');

describe('RF11.1 - Approvazione conformità', () => {
  let operatorToken;
  let propostaId;

  beforeAll(async () => {
    // Crea operatore per i test
    const admin = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const adminToken = admin.data?.data?.token;
    const opEmail = `rf11.1.op.${Date.now()}@test.com`;
    await makeRequest('POST', '/operatori', { email: opEmail, nome: 'Op', cognome: 'Conf', password: 'Operatore123!' }, adminToken);
    const loginOp = await makeRequest('POST', '/auth/login', { email: opEmail, password: 'Operatore123!' });
    operatorToken = loginOp.data?.data?.token;

    // Crea utente e proposta per i test
    const email = `rf11.1.user.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U', cognome: 'C', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    
    // Crea proposta di test con la struttura corretta (come in RF8)
    const propostaData = {
      titolo: 'Proposta RF11 Test',
      descrizione: 'Proposta di test per conformità RF11',
      categoria: 'cultura',
      proponenteID: login.data?.data?.user?._id,
      indirizzo_citta: 'Roma',
      indirizzo_cap: '00100',
      indirizzo_via: 'Via del Test',
      indirizzo_civico: '1',
      dataIpotetica: '2024-12-31'
    };
    
    const create = await makeRequest('POST', '/proposte', propostaData, login.data?.data?.token);
    expect(create.success).toBe(true);
    expect(create.status).toBe(201);
    propostaId = create.data?.data?._id;
    expect(propostaId).toBeDefined();
    
    // Verifica che la proposta sia nello stato iniziale (in_approvazione)
    const propostaRes = await makeRequest('GET', `/proposte/${propostaId}`, null, login.data?.data?.token);
    expect(propostaRes.success).toBe(true);
    expect(propostaRes.data?.data?.stato?.stato).toBe('in_approvazione');
  });

  test('RF11.1.1 - Operatore vede proposte pending', async () => {
    // Verifica che l'operatore veda le proposte pending
    const pendingRes = await makeRequest('GET', '/proposte/pending', null, operatorToken);
    expect(pendingRes.success).toBe(true);
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.data?.data).toBeDefined();
    expect(Array.isArray(pendingRes.data?.data)).toBe(true);
    
    // Verifica che la nostra proposta sia nella lista pending
    const nostraProposta = pendingRes.data?.data?.find(p => p._id === propostaId);
    expect(nostraProposta).toBeDefined();
    expect(nostraProposta.stato?.stato).toBe('in_approvazione');
    expect(nostraProposta.titolo).toBe('Proposta RF11 Test');
  });

  test('RF11.1.2 - Operatore può approvare proposta', async () => {
    // Approva la proposta creata per il test
    const approveRes = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { 
      stato: 'approvata', 
      commento: 'Proposta approvata per test RF11' 
    }, operatorToken);
    
    expect(approveRes.success).toBe(true);
    expect(approveRes.status).toBe(200);
    
    // Verifica che la proposta sia stata approvata
    const propostaAggiornata = await makeRequest('GET', `/proposte/${propostaId}`, null, operatorToken);
    expect(propostaAggiornata.success).toBe(true);
    expect(propostaAggiornata.data?.data?.stato?.stato).toBe('approvata');
    expect(propostaAggiornata.data?.data?.stato?.commento).toBe('Proposta approvata per test RF11');
  });

  test('RF11.1.3 - Non operatore riceve 403 su update stato', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'rifiutata' });
    expect(res.success).toBe(false);
    expect([401, 403]).toContain(res.status);
  });

  test('RF11.1.4 - Aggiornamento stato con valore non consentito gestito correttamente', async () => {
    const res = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { stato: 'non_valido' }, operatorToken);
    expect([200, 400, 500]).toContain(res.status);
    
    // Se la richiesta va a buon fine, verifica che lo stato non sia cambiato
    if (res.success) {
      const propostaRes = await makeRequest('GET', `/proposte/${propostaId}`, null, operatorToken);
      expect(propostaRes.data?.data?.stato?.stato).not.toBe('non_valido');
    }
  });

});


