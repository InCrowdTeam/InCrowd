const { makeRequest } = require('./rf-helpers');

describe('RF11.3 - Moderazione commenti', () => {
  let operatorToken;
  let userToken;
  let propostaId;
  let commentoId;

  beforeAll(async () => {
    // Crea operatore per i test
    const admin = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const adminToken = admin.data?.data?.token;
    const opEmail = `rf11.3.op.${Date.now()}@test.com`;
    await makeRequest('POST', '/operatori', { email: opEmail, nome: 'Op', cognome: 'Mod', password: 'Operatore123!' }, adminToken);
    const loginOp = await makeRequest('POST', '/auth/login', { email: opEmail, password: 'Operatore123!' });
    operatorToken = loginOp.data?.data?.token;

    // Crea utente e proposta per i test
    const email = `rf11.3.user.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U', cognome: 'M', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    userToken = login.data?.data?.token;
    
    // Crea proposta con struttura corretta (come in RF11.1)
    const propostaData = {
      titolo: 'Moderazione Commenti Test',
      descrizione: 'Proposta di test per moderazione commenti RF11.3',
      categoria: 'Test',
      proponenteID: login.data?.data?.user?._id,
      indirizzo_citta: 'Roma',
      indirizzo_cap: '00100',
      indirizzo_via: 'Via Moderazione',
      indirizzo_civico: '1',
      dataIpotetica: '2024-12-31'
    };
    
    const create = await makeRequest('POST', '/proposte', propostaData, userToken);
    expect(create.success).toBe(true);
    expect(create.status).toBe(201);
    propostaId = create.data?.data?._id;
    expect(propostaId).toBeDefined();
    
    // Verifica che non si possa commentare una proposta non approvata
    const addCommFail = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'Commento su proposta non approvata' }, userToken);
    expect(addCommFail.success).toBe(false);
    expect(addCommFail.status).toBe(403);
    
    // Approva la proposta per permettere i commenti nei test successivi
    const approveRes = await makeRequest('PATCH', `/proposte/${propostaId}/stato`, { 
      stato: 'approvata', 
      commento: 'Approvata per test moderazione' 
    }, operatorToken);
    expect(approveRes.success).toBe(true);
    
    // Ora crea un commento per i test (dopo l'approvazione)
    const addComm = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'Commento di test per moderazione' }, userToken);
    expect(addComm.success).toBe(true);
    commentoId = addComm.data?.data?.commenti?.slice(-1)?.[0]?._id;
    expect(commentoId).toBeDefined();
  });

  test('RF11.3.1 - Operatore può eliminare commenti su proposte approvate', async () => {
    // Verifica che la proposta sia già approvata (dal beforeAll)
    const propostaRes = await makeRequest('GET', `/proposte/${propostaId}`, null, operatorToken);
    expect(propostaRes.success).toBe(true);
    expect(propostaRes.data?.data?.stato?.stato).toBe('approvata');
    
    // Crea un nuovo commento per il test di eliminazione (su proposta approvata)
    const addComm = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'Commento da eliminare per test' }, userToken);
    expect(addComm.success).toBe(true);
    const commentoDaEliminare = addComm.data?.data?.commenti?.slice(-1)?.[0]?._id;
    expect(commentoDaEliminare).toBeDefined();
    
    // Operatore elimina il commento
    const deleteRes = await makeRequest('DELETE', `/proposte/${propostaId}/commenti/${commentoDaEliminare}`, null, operatorToken);
    expect(deleteRes.success).toBe(true);
    expect(deleteRes.status).toBe(200);
    
    // Verifica che il commento sia stato eliminato
    const commentiRes = await makeRequest('GET', `/proposte/${propostaId}/commenti`);
    expect(commentiRes.success).toBe(true);
    
    // Verifica che il commento non sia più presente
    const commentoEliminato = commentiRes.data?.data?.commenti?.find(c => c._id === commentoDaEliminare);
    expect(commentoEliminato).toBeUndefined();
  });

  test('RF11.3.2 - Tentativo eliminazione senza autenticazione -> 401', async () => {
    const res = await makeRequest('DELETE', `/proposte/${propostaId}/commenti/${commentoId}`);
    expect(res.success).toBe(false);
    expect(res.status).toBe(401);
  });

  test('RF11.3.3 - Eliminazione con ID commento errato -> 404', async () => {
    const fakeCommentoId = '000000000000000000000000';
    const res = await makeRequest('DELETE', `/proposte/${propostaId}/commenti/${fakeCommentoId}`, null, operatorToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });

  test('RF11.3.4 - Non si può hypare/commentare proposte non approvate', async () => {
    // Crea una nuova proposta non approvata per testare le restrizioni
    const email = `rf113.test2.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'Test2', cognome: 'User2', codiceFiscale: 'RSSMRA85C03H501W', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    
    const propostaData = {
      titolo: 'Proposta Non Approvata',
      descrizione: 'Test per verificare restrizioni',
      categoria: 'Test',
      proponenteID: login.data?.data?.user?._id,
      indirizzo_citta: 'Milano',
      indirizzo_cap: '20100',
      indirizzo_via: 'Via Test',
      indirizzo_civico: '1',
      dataIpotetica: '2024-12-31'
    };
    
    const create = await makeRequest('POST', '/proposte', propostaData, login.data?.data?.token);
    expect(create.success).toBe(true);
    const propostaNonApprovataId = create.data?.data?._id;
    
    // Testa che non si possa commentare proposta non approvata
    const commentRes = await makeRequest('POST', `/proposte/${propostaNonApprovataId}/commenti`, { contenuto: 'Commento non permesso' }, userToken);
    expect(commentRes.success).toBe(false);
    expect(commentRes.status).toBe(403);
    expect(commentRes.error?.message).toBe('Non è possibile commentare proposte non approvate');
    
    // Testa che non si possa hypare proposta non approvata
    const hypeRes = await makeRequest('PATCH', `/proposte/${propostaNonApprovataId}/hyper`, {}, userToken);
    expect(hypeRes.success).toBe(false);
    expect(hypeRes.status).toBe(403);
    expect(hypeRes.error?.message).toBe('Non è possibile hypare proposte non approvate');
  });
});


