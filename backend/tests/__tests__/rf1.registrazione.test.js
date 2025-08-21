const { makeRequest } = require('./rf-helpers');

const uniqueEmail = () => `rf1.${Date.now()}@test.com`;

describe('RF1 - Registrazione', () => {
  test('Creazione privato con password', async () => {
    const res = await makeRequest('POST', '/user', {
      user_type: 'privato',
      nome: 'Mario',
      cognome: 'Rossi',
      codiceFiscale: 'RSSMRA85C03H501U',
      email: uniqueEmail(),
      password: 'Password123!'
    });
    expect([201, 200]).toContain(res.status);
  });

  test('Creazione ente con oauthCode (senza password)', async () => {
    const res = await makeRequest('POST', '/user', {
      user_type: 'ente',
      nome: 'Comune Test', // nome is now the organization name
      codiceFiscale: 'RSSMRA85C03H501U',
      email: uniqueEmail(),
      oauthCode: 'fake-oauth-code'
    });
    expect([201, 200]).toContain(res.status);
  });

  test('Validazione: mancano campi obbligatori', async () => {
    const res = await makeRequest('POST', '/user', {
      user_type: 'privato',
      nome: 'SoloNome'
    });
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('Formato email non valido -> 400', async () => {
    const res = await makeRequest('POST', '/user', {
      user_type: 'privato',
      nome: 'Mario',
      cognome: 'Rossi',
      codiceFiscale: 'RSSMRA85C03H501U',
      email: 'not-an-email',
      password: 'Password123!'
    });
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });

  test('Email duplicata -> 409', async () => {
    const email = uniqueEmail();
    await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'Dup', cognome: 'Case', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!'
    });
    const res = await makeRequest('POST', '/user', {
      user_type: 'privato', nome: 'Dup', cognome: 'Case', codiceFiscale: 'RSSMRA85C03H501U', email, password: 'Password123!'
    });
    expect(res.success).toBe(false);
    expect(res.status).toBe(409);
  });
});


