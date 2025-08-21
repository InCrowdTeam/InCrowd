// Configurazione ambiente test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/incrowd-test';
process.env.ADMIN_EMAIL = 'admin@incrowd.com';
process.env.ADMIN_PASSWORD = 'admin123!';
process.env.TEST_BASE_URL = 'http://localhost:3000/api';