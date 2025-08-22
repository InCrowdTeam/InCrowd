const { makeRequest } = require('./rf-helpers');

describe('RF3.1 - Visualizzazione proposte', () => {
  test('Catalogo pubblico restituisce array di proposte approvate', async () => {
    const res = await makeRequest('GET', '/proposte');
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data?.data)).toBe(true);
  });

  test('Ricerca pubblica proposte per keyword', async () => {
    const res = await makeRequest('GET', '/proposte/search?q=test');
    expect(res.success).toBe(true);
    expect(res.data?.data).toBeDefined();
  });

  test('Dettaglio proposta per ID inesistente restituisce 404', async () => {
    const res = await makeRequest('GET', '/proposte/000000000000000000000000');
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });
});


