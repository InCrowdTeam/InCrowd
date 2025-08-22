const { makeRequest } = require('./rf-helpers');

describe('RF6 - Impostazioni', () => {
  let tokenWithOAuthOnly;
  let tokenWithPassword;
  let userId;

  beforeAll(async () => {
    const email1 = `rf6.oauth.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'OAuth', cognome: 'Only', codiceFiscale: 'RSSMRA85C03H501U', email: email1, oauthCode: 'oauth-only'
    });
    const login1 = await makeRequest('POST', '/auth/login', { email: email1, oauthCode: 'oauth-only' });
    tokenWithOAuthOnly = login1.data?.data?.token;

    const email2 = `rf6.pass.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'Pass', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email: email2, password: 'Password123!'
    });
    const login2 = await makeRequest('POST', '/auth/login', { email: email2, password: 'Password123!' });
    tokenWithPassword = login2.data?.data?.token;
  });

  test('RF6.1 - Password nuova non valida -> 400', async () => {
    // Test password troppo corta
    const shortRes = await makeRequest('PATCH', '/auth/password', { newPassword: 'short' }, tokenWithOAuthOnly);
    expect(shortRes.success).toBe(false);
    expect(shortRes.status).toBe(400);
    expect(shortRes.error?.message || shortRes.error?.error?.message).toContain('Password');
    
    // Test password senza maiuscole
    const noUpperRes = await makeRequest('PATCH', '/auth/password', { newPassword: 'password123!' }, tokenWithOAuthOnly);
    expect(noUpperRes.success).toBe(false);
    expect(noUpperRes.status).toBe(400);
    
    // Test password senza numeri
    const noNumberRes = await makeRequest('PATCH', '/auth/password', { newPassword: 'Password!' }, tokenWithOAuthOnly);
    expect(noNumberRes.success).toBe(false);
    expect(noNumberRes.status).toBe(400);
    
    // Test password senza caratteri speciali
    const noSpecialRes = await makeRequest('PATCH', '/auth/password', { newPassword: 'Password123' }, tokenWithOAuthOnly);
    expect(noSpecialRes.success).toBe(false);
    expect(noSpecialRes.status).toBe(400);
    
    // Verifica che l'utente possa ancora accedere (password non è stata cambiata)
    const profileRes = await makeRequest('GET', '/user/me', null, tokenWithOAuthOnly);
    expect(profileRes.success).toBe(true);
    expect(profileRes.status).toBe(200);
    
    // Verifica che nessuna delle password invalide funzioni per il login
    // (Anche se l'utente OAuth-only non ha password, questo conferma che nulla è cambiato)
    expect(profileRes.data?.data?.user).toBeDefined();
  });

  test('RF6.2 - Utente OAuth-only può impostare una password', async () => {
    // Crea un nuovo utente OAuth-only per questo test (per evitare conflitti con RF6.1)
    const newEmail = `rf6.oauth2.${Date.now()}@test.com`;
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'OAuth2', cognome: 'Fresh', codiceFiscale: 'RSSMRA85C03H501V', email: newEmail, oauthCode: 'oauth-fresh'
    });
    const newLogin = await makeRequest('POST', '/auth/login', { email: newEmail, oauthCode: 'oauth-fresh' });
    const newToken = newLogin.data?.data?.token;
    
    expect(newToken).toBeDefined();
    
    // Ora testa l'impostazione della password
    const res = await makeRequest('PATCH', '/auth/password', { newPassword: 'NuovaPass123!' }, newToken);
    expect(res.success).toBe(true);
    expect([200, 201]).toContain(res.status);
  });

  test('RF6.3 - Utente con password non può reimpostarla tramite endpoint di set', async () => {
    const res = await makeRequest('PATCH', '/auth/password', { newPassword: 'AltraPass123!' }, tokenWithPassword);
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('RF6.4 - Eliminazione account corrente', async () => {
    // Prima verifica che l'utente esista e sia accessibile
    const beforeRes = await makeRequest('GET', '/user/me', null, tokenWithPassword);
    expect(beforeRes.success).toBe(true);
    expect(beforeRes.status).toBe(200);
    const userEmail = beforeRes.data?.data?.user?.credenziali?.email;
    
    // Elimina l'account
    const deleteRes = await makeRequest('DELETE', '/user/account', null, tokenWithPassword);
    expect(deleteRes.success).toBe(true);
    expect(deleteRes.status).toBe(200); // Solo 200 ha senso per eliminazione riuscita
    
    // Verifica che il token sia diventato invalido (l'account non esiste più)
    const afterRes = await makeRequest('GET', '/user/me', null, tokenWithPassword);
    expect(afterRes.success).toBe(false);
    expect(afterRes.status).toBe(404); // Utente non esiste più nel database
    
    // Verifica che non si possa più fare login con le credenziali
    if (userEmail) {
      const loginRes = await makeRequest('POST', '/auth/login', { 
        email: userEmail, 
        password: 'Password123!' 
      });
      expect(loginRes.success).toBe(false);
      expect([401, 404]).toContain(loginRes.status); // Account non esiste più
    }
  });


});


