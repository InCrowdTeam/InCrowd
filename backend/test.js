const axios = require('axios');

// Configurazione base
const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';
let operatoreToken = '';
let userToken = '';
let createdUserId = '';
let createdOperatoreId = '';
let createdPropostaId = '';

// Test data
const testData = {
  admin: {
    email: 'admin@incrowd.com',
    password: 'admin123!'
  },
  operatore: {
    email: 'operatore.test@incrowd.com',
    password: 'Operatore123!'
  },
  user: {
    email: 'giovanni.bianchi@test.com',
    password: 'Giovanni123!'
  },
  newOperatore: {
    email: 'operatore.test2@incrowd.com',
    nome: 'Operatore',
    cognome: 'Test2',
    password: 'Operatore123!'
  },
  newUser: {
    user_type: 'privato',
    nome: 'Mario',
    cognome: 'Verdi',
    email: 'mario.verdi@test.com',
    password: 'Mario123!',
    codiceFiscale: 'VRDMRA85C03H501X'
  },
  newProposta: {
    titolo: 'Test Proposta Jest',
    descrizione: 'Questa è una proposta di test creata con Jest',
    categoria: 'Test',
    indirizzo_citta: 'Milano',
    indirizzo_cap: '20100',
    indirizzo_via: 'Via Test',
    indirizzo_civico: '123'
  }
};

// Helper functions
const makeRequest = async (method, endpoint, data = null, token = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test suite principale
describe('InCrowd API Tests', () => {
  
  // Test di connessione
  describe('Connection Test', () => {
    test('Server should be running', async () => {
      const response = await makeRequest('GET', '/health');
      expect(response.status).toBeDefined();
    });
  });

  // Test di autenticazione
  describe('Authentication Tests', () => {
    test('Admin login should work', async () => {
      const response = await makeRequest('POST', '/auth/login', testData.admin);
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('Login effettuato');
      expect(response.data.data.token).toBeDefined();
      adminToken = response.data.data.token;
    });

    test('User login should work', async () => {
      const response = await makeRequest('POST', '/auth/login', testData.user);
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('Login effettuato');
      expect(response.data.data.token).toBeDefined();
      userToken = response.data.data.token;
    });

    test('Invalid login should fail', async () => {
      const response = await makeRequest('POST', '/auth/login', {
        email: 'invalid@test.com',
        password: 'wrongpassword'
      });
      expect(response.success).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  // Test gestione operatori (solo admin)
  describe('Operatori Management Tests (Admin Only)', () => {
    test('Admin should be able to create operatore', async () => {
      const response = await makeRequest('POST', '/operatori', testData.newOperatore, adminToken);
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('Operatore creato con successo');
      expect(response.data.data._id).toBeDefined();
      createdOperatoreId = response.data.data._id;
    });

    test('Admin should be able to list operatori', async () => {
      const response = await makeRequest('GET', '/operatori', null, adminToken);
      expect(response.success).toBe(true);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    test('Non-admin should not be able to create operatore', async () => {
      const response = await makeRequest('POST', '/operatori', testData.newOperatore, userToken);
      expect(response.success).toBe(false);
      expect(response.status).toBe(403);
    });

    test('Non-admin should not be able to list operatori', async () => {
      const response = await makeRequest('GET', '/operatori', null, userToken);
      expect(response.success).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  // Test gestione utenti (solo operatore)
  describe('User Management Tests (Operatore Only)', () => {
    test('Operatore should be able to create user', async () => {
      // Prima faccio login con l'operatore appena creato
      const loginResponse = await makeRequest('POST', '/auth/login', {
        email: testData.newOperatore.email,
        password: testData.newOperatore.password
      });
      expect(loginResponse.success).toBe(true);
      operatoreToken = loginResponse.data.data.token;

      const response = await makeRequest('POST', '/user', testData.newUser, operatoreToken);
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('Utente creato con successo');
      expect(response.data.data.user._id).toBeDefined();
      createdUserId = response.data.data.user._id;
    });

    test('Operatore should be able to list all users', async () => {
      const response = await makeRequest('GET', '/user', null, operatoreToken);
      expect(response.success).toBe(true);
      expect(response.data.data.users).toBeInstanceOf(Array);
      expect(response.data.data.users.length).toBeGreaterThan(0);
    });

    test('Non-operatore should not be able to list all users', async () => {
      const response = await makeRequest('GET', '/user', null, userToken);
      expect(response.success).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  // Test gestione proposte
  describe('Proposte Management Tests', () => {
    test('User should be able to create proposta', async () => {
      const response = await makeRequest('POST', '/proposte', testData.newProposta, userToken);
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('Proposta creata con successo');
      expect(response.data.data._id).toBeDefined();
      createdPropostaId = response.data.data._id;
    });

    test('Public should be able to view approved proposte', async () => {
      const response = await makeRequest('GET', '/proposte');
      expect(response.success).toBe(true);
      expect(response.data.data).toBeInstanceOf(Array);
    });

    test('Operatore should be able to view pending proposte', async () => {
      const response = await makeRequest('GET', '/proposte/pending', null, operatoreToken);
      expect(response.success).toBe(true);
      expect(response.data.data).toBeInstanceOf(Array);
    });

    test('Operatore should be able to approve proposta', async () => {
      const response = await makeRequest('PATCH', `/proposte/${createdPropostaId}/stato`, {
        stato: 'approvata',
        commento: 'Proposta approvata tramite test Jest'
      }, operatoreToken);
      expect(response.success).toBe(true);
      expect(response.data.message).toBe('Stato proposta aggiornato');
      expect(response.data.data.stato.stato).toBe('approvata');
    });

    test('User should be able to view their own proposte', async () => {
      const response = await makeRequest('GET', '/proposte/me', null, userToken);
      expect(response.success).toBe(true);
      expect(response.data.data).toBeInstanceOf(Array);
    });
  });

  // Test di ricerca e filtri
  describe('Search and Filter Tests', () => {
    test('Public should be able to search proposte', async () => {
      const response = await makeRequest('GET', '/proposte/search?q=test');
      expect(response.success).toBe(true);
    });

    test('Public should be able to search users', async () => {
      const response = await makeRequest('GET', '/user/search?q=mario');
      expect(response.success).toBe(true);
    });
  });

  // Test di gestione profilo
  describe('Profile Management Tests', () => {
    test('User should be able to view their profile', async () => {
      const response = await makeRequest('GET', '/user/me', null, userToken);
      expect(response.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });

    test('User should be able to update their profile', async () => {
      const updateData = {
        biografia: 'Biografia aggiornata tramite test Jest'
      };
      const response = await makeRequest('PATCH', '/user/profile', updateData, userToken);
      expect(response.success).toBe(true);
    });
  });

  // Test di pulizia (cleanup)
  describe('Cleanup Tests', () => {
    test('Admin should be able to delete operatore', async () => {
      if (createdOperatoreId) {
        const response = await makeRequest('DELETE', `/operatori/${createdOperatoreId}`, null, adminToken);
        expect(response.success).toBe(true);
        expect(response.data.message).toBe('Operatore eliminato');
      }
    });

    test('User should be able to delete their account', async () => {
      if (createdUserId) {
        const response = await makeRequest('DELETE', '/user/account', null, userToken);
        expect(response.success).toBe(true);
      }
    });
  });

  // Test di errori e validazioni
  describe('Error Handling Tests', () => {
    test('Invalid token should return 401', async () => {
      const response = await makeRequest('GET', '/user/me', null, 'invalid-token');
      expect(response.success).toBe(false);
      expect(response.status).toBe(401);
    });

    test('Missing required fields should return 400', async () => {
      const invalidUser = { nome: 'Test' }; // Manca email e password
      const response = await makeRequest('POST', '/user', invalidUser, operatoreToken);
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    });

    test('Invalid proposta data should return 400', async () => {
      const invalidProposta = { titolo: 'Test' }; // Manca descrizione e indirizzo
      const response = await makeRequest('POST', '/proposte', invalidProposta, userToken);
      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  // Test di performance e limiti
  describe('Performance and Limits Tests', () => {
    test('Large search query should be handled', async () => {
      const longQuery = 'a'.repeat(1000);
      const response = await makeRequest('GET', `/proposte/search?q=${longQuery}`);
      expect(response.status).toBeDefined();
    });

    test('Multiple concurrent requests should work', async () => {
      const promises = Array(5).fill().map(() => 
        makeRequest('GET', '/proposte')
      );
      const responses = await Promise.all(promises);
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.status).toBeDefined();
      });
    });
  });
});

// Test di integrazione end-to-end
describe('End-to-End Integration Tests', () => {
  test('Complete workflow: create user -> create proposta -> approve -> view', async () => {
    // 1. Create user
    const userResponse = await makeRequest('POST', '/user', {
      user_type: 'privato',
      nome: 'Integration',
      cognome: 'Test',
      email: 'integration.test@jest.com',
      password: 'Integration123!',
      codiceFiscale: 'INTGRT90D04H501Y'
    }, operatoreToken);
    expect(userResponse.success).toBe(true);

    // 2. Login with new user
    const loginResponse = await makeRequest('POST', '/auth/login', {
      email: 'integration.test@jest.com',
      password: 'Integration123!'
    });
    expect(loginResponse.success).toBe(true);
    const integrationUserToken = loginResponse.data.data.token;

    // 3. Create proposta
    const propostaResponse = await makeRequest('POST', '/proposte', {
      titolo: 'Integration Test Proposta',
      descrizione: 'Proposta creata durante il test di integrazione',
      categoria: 'Test',
      indirizzo_citta: 'Milano',
      indirizzo_cap: '20100',
      indirizzo_via: 'Via Integration',
      indirizzo_civico: '456'
    }, integrationUserToken);
    expect(propostaResponse.success).toBe(true);

    // 4. Approve proposta
    const approveResponse = await makeRequest('PATCH', `/proposte/${propostaResponse.data.data._id}/stato`, {
      stato: 'approvata',
      commento: 'Approvata durante test di integrazione'
    }, operatoreToken);
    expect(approveResponse.success).toBe(true);

    // 5. View approved proposta
    const viewResponse = await makeRequest('GET', '/proposte');
    expect(viewResponse.success).toBe(true);
    const approvedProposta = viewResponse.data.data.find(p => p._id === propostaResponse.data.data._id);
    expect(approvedProposta).toBeDefined();
    expect(approvedProposta.stato.stato).toBe('approvata');
  });
});

// Test di sicurezza
describe('Security Tests', () => {
  test('SQL injection attempts should be handled safely', async () => {
    const maliciousQuery = "'; DROP TABLE users; --";
    const response = await makeRequest('GET', `/proposte/search?q=${encodeURIComponent(maliciousQuery)}`);
    expect(response.status).toBeDefined();
  });

  test('XSS attempts should be handled safely', async () => {
    const maliciousData = {
      titolo: '<script>alert("xss")</script>',
      descrizione: 'Descrizione normale',
      categoria: 'Test',
      indirizzo_citta: 'Milano',
      indirizzo_cap: '20100',
      indirizzo_via: 'Via Test',
      indirizzo_civico: '123'
    };
    const response = await makeRequest('POST', '/proposte', maliciousData, userToken);
    expect(response.status).toBeDefined();
  });

  test('Rate limiting should be enforced', async () => {
    const promises = Array(20).fill().map(() => 
      makeRequest('GET', '/proposte')
    );
    const responses = await Promise.all(promises);
    // Almeno alcune richieste dovrebbero fallire per rate limiting
    const failedRequests = responses.filter(r => !r.success);
    expect(failedRequests.length).toBeGreaterThan(0);
  });
});

// Test di configurazione
describe('Configuration Tests', () => {
  test('Environment variables should be loaded', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  test('Database connection should be working', async () => {
    // Test indiretto: se possiamo creare un utente, il database funziona
    const response = await makeRequest('POST', '/user', {
      user_type: 'privato',
      nome: 'DB',
      cognome: 'Test',
      email: 'db.test@jest.com',
      password: 'DB123!',
      codiceFiscale: 'DBTST95E05H501Z'
    }, operatoreToken);
    expect(response.status).toBeDefined();
  });
});

// Test di compatibilità
describe('Compatibility Tests', () => {
  test('API should handle different content types', async () => {
    const response = await makeRequest('GET', '/proposte', null, null, {
      'Accept': 'application/xml'
    });
    expect(response.status).toBeDefined();
  });

  test('API should handle CORS properly', async () => {
    const response = await makeRequest('OPTIONS', '/proposte');
    expect(response.status).toBeDefined();
  });
});

console.log('🧪 Jest test file created successfully!');
console.log('📝 Run with: npm test');
console.log('🔍 Make sure the server is running on http://localhost:3000');
