// ========================================
// JEST TEST SETUP - INCROWD API
// ========================================

// Configurazione globale per i test
global.console = {
  ...console,
  // Disabilita i log durante i test per output più pulito
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Timeout globale per i test
jest.setTimeout(30000);

// Mock per process.env
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGO_URI = 'mongodb://localhost:27017/incrowd-test';

// Helper functions globali per i test
global.testHelpers = {
  // Genera dati di test validi
  generateTestData: {
    admin: () => ({
      email: 'admin@test.com',
      password: 'Admin123!'
    }),
    
    operatore: () => ({
      email: 'operatore@test.com',
      password: 'Operatore123!'
    }),
    
    user: () => ({
      email: 'user@test.com',
      password: 'User123!'
    }),
    
    newOperatore: () => ({
      email: `operatore.${Date.now()}@test.com`,
      nome: 'Operatore',
      cognome: 'Test',
      password: 'Operatore123!'
    }),
    
    newUser: () => ({
      user_type: 'privato',
      nome: 'Mario',
      cognome: 'Verdi',
      email: `mario.${Date.now()}@test.com`,
      password: 'Mario123!',
      codiceFiscale: 'VRDMRA85C03H501X'
    }),
    
    newProposta: () => ({
      titolo: `Proposta Test ${Date.now()}`,
      descrizione: 'Questa è una proposta di test',
      categoria: 'Test',
      indirizzo_citta: 'Milano',
      indirizzo_cap: '20100',
      indirizzo_via: 'Via Test',
      indirizzo_civico: '123'
    })
  },
  
  // Valida risposta API
  validateApiResponse: (response, expectedStatus = 200) => {
    expect(response).toBeDefined();
    expect(response.status).toBe(expectedStatus);
    
    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.data).toBeDefined();
      expect(response.data.message).toBeDefined();
    }
  },
  
  // Valida struttura utente
  validateUserStructure: (user) => {
    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.nome).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  },
  
  // Valida struttura proposta
  validatePropostaStructure: (proposta) => {
    expect(proposta).toBeDefined();
    expect(proposta._id).toBeDefined();
    expect(proposta.titolo).toBeDefined();
    expect(proposta.descrizione).toBeDefined();
    expect(proposta.proponenteID).toBeDefined();
    expect(proposta.stato).toBeDefined();
    expect(proposta.createdAt).toBeDefined();
    expect(proposta.updatedAt).toBeDefined();
  },
  
  // Valida struttura operatore
  validateOperatoreStructure: (operatore) => {
    expect(operatore).toBeDefined();
    expect(operatore._id).toBeDefined();
    expect(operatore.nome).toBeDefined();
    expect(operatore.cognome).toBeDefined();
    expect(operatore.credenziali).toBeDefined();
    expect(operatore.credenziali.email).toBeDefined();
    expect(operatore.createdAt).toBeDefined();
    expect(operatore.updatedAt).toBeDefined();
  },
  
  // Genera token JWT di test
  generateTestToken: (userType = 'user', userId = 'test-user-id') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        userId, 
        userType, 
        email: 'test@test.com' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  // Attendi un certo tempo (per test asincroni)
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Genera ID MongoDB di test
  generateTestId: () => {
    const mongoose = require('mongoose');
    return new mongoose.Types.ObjectId();
  },
  
  // Pulisci stringhe per confronti
  cleanString: (str) => str.replace(/\s+/g, ' ').trim(),
  
  // Valida formato email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Valida formato codice fiscale italiano
  isValidCodiceFiscale: (cf) => {
    const cfRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;
    return cfRegex.test(cf);
  },
  
  // Valida password forte
  isValidPassword: (password) => {
    // Almeno 8 caratteri, una maiuscola, una minuscola, un numero
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
};

// Mock per mongoose (se necessario)
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
});

// Mock per bcrypt (se necessario)
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
  genSalt: jest.fn(() => Promise.resolve('test-salt')),
}));

// Mock per jsonwebtoken (se necessario)
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => 'test-jwt-token'),
  verify: jest.fn((token, secret) => ({ userId: 'test-user-id', userType: 'user' })),
}));

// Setup per ogni test
beforeEach(() => {
  // Reset dei mock
  jest.clearAllMocks();
  
  // Reset delle variabili globali
  global.testData = {};
  global.testTokens = {};
  global.testIds = {};
});

// Teardown per ogni test
afterEach(() => {
  // Cleanup
  jest.restoreAllMocks();
});

// Setup globale
beforeAll(() => {
  console.log('🧪 Jest test environment setup completed');
  console.log('📝 Test timeout set to 30 seconds');
  console.log('🔧 Global test helpers available');
});

// Teardown globale
afterAll(() => {
  console.log('🧹 Jest test environment cleanup completed');
});

// Gestione errori non catturati
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Esporta per uso esterno
module.exports = {
  testHelpers: global.testHelpers
};
