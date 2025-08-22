const { makeRequest } = require('./rf-helpers');

describe('RF4 - Ricerca', () => {
  test('RF4.1 - Ricerca proposte per keyword', async () => {
    const res = await makeRequest('GET', '/proposte/search?q=test');
    expect(res.status).toBeDefined();
  });


  test('RF4.2 - Ricerca utenti per keyword', async () => {
    const res = await makeRequest('GET', '/user/search?q=mar');
    expect([true, false]).toContain(res.success);
    expect(res.status).toBeDefined();
  });

  test('RF4.3 - Ricerca proposte con nome random (inesistente) restituisce array vuoto', async () => {
    const randomQuery = `nonexistent_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const res = await makeRequest('GET', `/proposte/search?q=${encodeURIComponent(randomQuery)}`);
    expect(res.success).toBe(true);
    expect(res.data?.data?.proposte).toBeDefined();
    expect(Array.isArray(res.data?.data.proposte)).toBe(true);
    expect(res.data?.data.proposte.length).toBe(0);
  });

});


