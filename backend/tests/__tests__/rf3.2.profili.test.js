const { makeRequest, loginAs } = require('./rf-helpers');

describe('RF3.2 - Visualizzazione profili', () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    // Crea un utente di test per i test
    const email = `rf32.${Date.now()}@test.com`;
    const password = 'Password123!';
    await makeRequest('POST', '/user', { 
      user_type: 'privato', 
      nome: 'Test', 
      cognome: 'User', 
      codiceFiscale: 'RSSMRA85C03H501W', 
      email, 
      password 
    });
    const login = await makeRequest('POST', '/auth/login', { email, password });
    userToken = login.data?.data?.token;
    userId = login.data?.data?.user?._id;
    
    // Verifica che l'utente sia stato creato correttamente
    expect(userToken).toBeDefined();
    expect(userId).toBeDefined();
  });

  test('Visualizzazione profilo utente esistente', async () => {
    const res = await makeRequest('GET', `/user/${userId}`);
    
    expect(res.success).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data?.data?.user).toBeDefined();
    expect(res.data?.data.user._id).toBe(userId);
    expect(res.data?.data.user.nome).toBe('Test');
    expect(res.data?.data.user.cognome).toBe('User');
    expect(res.data?.data.user.user_type).toBe('privato');
  });

  test('Profilo inesistente restituisce 404', async () => {
    const res = await makeRequest('GET', '/user/000000000000000000000000');
    
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
    expect(res.error?.message).toBe('Utente non trovato');
  });

  test('Visualizzazione profilo con dati parziali', async () => {
    // Crea un utente con profilo minimo (solo campi obbligatori)
    const minimalEmail = `rf32.minimal.${Date.now()}@test.com`;
    const minimalPassword = 'Password123!';
    
    const createRes = await makeRequest('POST', '/user', { 
      user_type: 'ente', 
      nome: 'Ente', 
      codiceFiscale: 'RSSMRA85C03H501X', 
      email: minimalEmail, 
      password: minimalPassword 
    });
    
    expect(createRes.success).toBe(true);
    const minimalUserId = createRes.data?.data?.user?._id;
    
    // Verifica che il profilo sia visualizzabile anche con dati parziali
    const profileRes = await makeRequest('GET', `/user/${minimalUserId}`);
    
    expect(profileRes.success).toBe(true);
    expect(profileRes.status).toBe(200);
    expect(profileRes.data?.data?.user).toBeDefined();
    expect(profileRes.data?.data.user._id).toBe(minimalUserId);
    expect(profileRes.data?.data.user.nome).toBe('Ente');
    expect(profileRes.data?.data.user.user_type).toBe('ente');
    // Verifica che campi opzionali possano essere undefined/null
    expect(profileRes.data?.data.user.cognome).toBeUndefined();
    // Il codice fiscale potrebbe non essere visibile pubblicamente
    // Verifichiamo solo che i campi obbligatori siano presenti
    expect(profileRes.data?.data.user.nome).toBeDefined();
    expect(profileRes.data?.data.user.user_type).toBeDefined();
  });
});


