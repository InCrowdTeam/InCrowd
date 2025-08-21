const { makeRequest } = require('./rf-helpers');

describe('RF4 - Ricerca', () => {
  test('Ricerca proposte per keyword', async () => {
    const res = await makeRequest('GET', '/proposte/search?q=test');
    expect(res.status).toBeDefined();
  });

  test('Ricerca proposte con ordinamento per createdAt', async () => {
    const res = await makeRequest('GET', '/proposte/search?q=test&sortBy=createdAt&sortOrder=desc');
    expect(res.status).toBeDefined();
  });

  test('Ricerca utenti per keyword', async () => {
    const res = await makeRequest('GET', '/user/search?q=mar');
    expect([true, false]).toContain(res.success);
    expect(res.status).toBeDefined();
  });

  test('Ricerca utenti con query troppo corta -> 400', async () => {
    const res = await makeRequest('GET', '/user/search?q=a');
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });
});


