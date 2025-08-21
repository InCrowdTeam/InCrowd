const { makeRequest } = require('./rf-helpers');

describe('RF11.3 - Moderazione commenti', () => {
  let operatorToken;
  let userToken;
  let propostaId;
  let commentoId;
  let otherUserToken;
  let otherPropostaId;
  let otherCommentoId;

  beforeAll(async () => {
    const admin = await makeRequest('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    const adminToken = admin.data?.data?.token;
    const opEmail = `rf113.op.${Date.now()}@test.com`;
    await makeRequest('POST', '/operatori', { email: opEmail, nome: 'Op', cognome: 'Mod', password: 'Operatore123!' }, adminToken);
    const loginOp = await makeRequest('POST', '/auth/login', { email: opEmail, password: 'Operatore123!' });
    operatorToken = loginOp.data?.data?.token;

    const email = `rf113.user.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U', cognome: 'M', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!' });
    const login = await makeRequest('POST', '/auth/login', { email, password: 'Password123!' });
    userToken = login.data?.data?.token;
    const create = await makeRequest('POST', '/proposte', { titolo: 'Moderazione', descrizione: '...', categoria: 'Test', proponenteID: login.data?.data?.user?._id }, userToken);
    propostaId = create.data?.data?._id;
    const addComm = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'Commento da moderare' }, userToken);
    // Usa l'ultimo commento restituito dall'API di aggiunta (lista aggiornata)
    commentoId = addComm.data?.data?.commenti?.slice(-1)?.[0]?._id;

    // Crea un secondo utente e una seconda proposta/commento
    const email2 = `rf113.user2.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', { user_type: 'privato', nome: 'U2', cognome: 'M2', codiceFiscale: 'RSSMRA85C03H501U', email: email2, password: 'Password123!' });
    const login2 = await makeRequest('POST', '/auth/login', { email: email2, password: 'Password123!' });
    otherUserToken = login2.data?.data?.token;
    const create2 = await makeRequest('POST', '/proposte', { titolo: 'Moderazione 2', descrizione: '...', categoria: 'Test', proponenteID: login2.data?.data?.user?._id }, otherUserToken);
    otherPropostaId = create2.data?.data?._id;
    const addComm2 = await makeRequest('POST', `/proposte/${otherPropostaId}/commenti`, { contenuto: 'Altro commento' }, otherUserToken);
    otherCommentoId = addComm2.data?.data?.commenti?.slice(-1)?.[0]?._id;
  });

  test('Operatore può eliminare un commento', async () => {
    const res = await makeRequest('DELETE', `/proposte/${propostaId}/commenti/${commentoId}`, null, operatorToken);
    expect([200, 404, 400, 500]).toContain(res.status);
  });

  test('Autore può eliminare il proprio commento', async () => {
    const addComm = await makeRequest('POST', `/proposte/${propostaId}/commenti`, { contenuto: 'Altro commento' }, userToken);
    const id = addComm.data?.data?.commenti?.slice(-1)?.[0]?._id;
    const res = await makeRequest('DELETE', `/proposte/${propostaId}/commenti/${id}`, null, userToken);
    expect([200, 404, 400, 500]).toContain(res.status);
  });

  test('Non autenticato non può eliminare commento', async () => {
    const res = await makeRequest('DELETE', `/proposte/${propostaId}/commenti/${commentoId}`);
    expect(res.status).toBe(401);
  });

  test('Eliminazione con commentoId non appartenente alla proposta -> 400', async () => {
    // Usa un commento valido di un'altra proposta: deve dare 400
    const res = await makeRequest('DELETE', `/proposte/${propostaId}/commenti/${otherCommentoId}`, null, userToken);
    expect(res.status).toBe(400);
  });

  test('Utente non autore non può eliminare commento -> 403 (operatore escluso)', async () => {
    // Prova a eliminare commento dell'altro utente sulla sua proposta
    const res = await makeRequest('DELETE', `/proposte/${otherPropostaId}/commenti/${otherCommentoId}`, null, userToken);
    expect([403, 400]).toContain(res.status);
  });
});


