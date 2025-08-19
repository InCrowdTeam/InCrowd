// Setup base per Jest
jest.setTimeout(30000);

// Variabili ambiente di test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';