const { makeRequest } = require('./rf-helpers');

describe('RF3.1.1 - Visualizzazione proposte', () => {
  test('Catalogo pubblico restituisce array di proposte approvate', async () => {
    const res = await makeRequest('GET', '/proposte');
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data?.data)).toBe(true);
  });

  test('RF3.1.2 - Dettaglio proposta per ID inesistente restituisce 404', async () => {
    const res = await makeRequest('GET', '/proposte/000000000000000000000000');
    expect(res.success).toBe(false);
    expect(res.status).toBe(404);
  });

  // NOTA: Non è possibile impostare MONGO_URI=memory solo per questo test da qui.
  // Questo test funziona solo se il database è vuoto (es. ambiente di test isolato).
  test.skip('RF3.1.3 - Catalogo pubblico vuoto restituisce array vuoto', async () => {
    const res = await makeRequest('GET', '/proposte');
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data?.data)).toBe(true);
    expect(res.data?.data.length).toBe(0);
  });
  
});


