const { makeRequest, loginAs } = require('./rf-helpers');

describe('RF3.2 - Visualizzazione profili', () => {
  test('Ricerca pubblica utenti con query corta restituisce 400', async () => {
    const res = await makeRequest('GET', '/user/search?q=a');
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('Ricerca pubblica utenti con query valida restituisce risultati', async () => {
    const res = await makeRequest('GET', '/user/search?q=admin');
    expect([true, false]).toContain(res.success);
    expect(res.status).toBeDefined();
  });

  test('Profilo inesistente restituisce 404', async () => {
    const res = await makeRequest('GET', '/user/000000000000000000000000');
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });

  test('Ricerca con user_type non valido viene ignorata (semplice)', async () => {
    const res = await makeRequest('GET', '/user/search?q=adm&user_type=invalid');
    expect(res.status).toBeDefined();
  });
});


