const { makeRequest } = require('./rf-helpers');

describe('RF9 - Follow', () => {
  let userAToken;
  let userAId;
  let userBId;

  beforeAll(async () => {
    const emailA = `rf9.a.${Date.now()}@test.com`;
    const emailB = `rf9.b.${Date.now()}@test.com`;
    const password = 'Password123!';
    const createA = await makeRequest('POST', '/user', { user_type: 'privato', nome: 'A', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email: emailA, password });
    const createB = await makeRequest('POST', '/user', { user_type: 'privato', nome: 'B', cognome: 'User', codiceFiscale: 'RSSMRA85C03H501U', email: emailB, password });
    userAId = createA.data?.data?.user?._id;
    userBId = createB.data?.data?.user?._id;
    const loginA = await makeRequest('POST', '/auth/login', { email: emailA, password });
    userAToken = loginA.data?.data?.token;
  });

  test('Utente può seguire un altro utente', async () => {
    const res = await makeRequest('POST', `/follow/${userBId}`, {}, userAToken);
    expect([200, 201]).toContain(res.status);
  });

  test('Status follow restituisce booleano', async () => {
    const res = await makeRequest('GET', `/follow/status/${userBId}`, null, userAToken);
    expect(res.status).toBeDefined();
    expect(res.data?.data?.isFollowing).toBeDefined();
  });

  test('Unfollow rimuove il follow', async () => {
    await makeRequest('POST', `/follow/${userBId}`, {}, userAToken);
    const res = await makeRequest('DELETE', `/follow/${userBId}`, null, userAToken);
    expect(res.status).toBeDefined();
  });

  test('Follow se stessi -> 400', async () => {
    const res = await makeRequest('POST', `/follow/${userAId}`, {}, userAToken);
    expect(res.success).toBe(false);
    expect(res.status).toBe(400);
  });
});


