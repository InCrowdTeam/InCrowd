// ========================================
// TEST ENVIRONMENT CONFIGURATION
// ========================================

// Carica le variabili d'ambiente per i test
require('dotenv').config({ path: '.env.test' });

// Configurazione ambiente di test
const testConfig = {
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/incrowd-test',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: 'test',
  
  // Google OAuth (per test)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret',
  
  // File upload (per test)
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads-test',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
  
  // Rate limiting (per test)
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 min
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || 100,
  
  // Logging (disabilitato per test)
  LOG_LEVEL: 'error',
  
  // CORS (per test)
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Security (per test)
  ENABLE_SECURITY_CONTROLS: process.env.ENABLE_SECURITY_CONTROLS !== 'false',
  PASSWORD_MIN_LENGTH: process.env.PASSWORD_MIN_LENGTH || 8,
  
  // Test specific
  TEST_TIMEOUT: 30000,
  TEST_RETRIES: 3,
  TEST_DELAY: 1000,
  
  // Mock services
  MOCK_EMAIL_SERVICE: true,
  MOCK_FILE_SERVICE: true,
  MOCK_EXTERNAL_APIS: true
};

// Applica la configurazione
Object.keys(testConfig).forEach(key => {
  process.env[key] = testConfig[key];
});

// Configurazione per Jest
module.exports = {
  testConfig,
  
  // Helper per configurare l'ambiente di test
  setupTestEnvironment: () => {
    // Crea directory di test se non esistono
    const fs = require('fs');
    const path = require('path');
    
    const testDirs = [
      testConfig.UPLOAD_PATH,
      './logs-test',
      './temp-test'
    ];
    
    testDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    console.log('📁 Test directories created');
  },
  
  // Helper per pulire l'ambiente di test
  cleanupTestEnvironment: () => {
    const fs = require('fs');
    const path = require('path');
    
    const testDirs = [
      testConfig.UPLOAD_PATH,
      './logs-test',
      './temp-test'
    ];
    
    testDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
    
    console.log('🧹 Test directories cleaned up');
  },
  
  // Helper per generare dati di test
  generateTestData: {
    // Genera email unica per test
    uniqueEmail: (prefix = 'test') => {
      return `${prefix}.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@test.com`;
    },
    
    // Genera codice fiscale valido per test
    validCodiceFiscale: () => {
      const surnames = ['ROSSI', 'BIANCHI', 'VERDI', 'NERI', 'GIALLI'];
      const names = ['MARIO', 'LUIGI', 'GIUSEPPE', 'ANTONIO', 'FRANCESCO'];
      const months = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];
      const cities = ['A001', 'A002', 'A003', 'A004', 'A005'];
      
      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const year = Math.floor(Math.random() * 50) + 50; // 1950-1999
      const month = months[Math.floor(Math.random() * months.length)];
      const day = Math.floor(Math.random() * 28) + 1;
      const city = cities[Math.floor(Math.random() * cities.length)];
      
      return `${surname}${name}${year}${month}${day.toString().padStart(2, '0')}${city}`;
    },
    
    // Genera password valida per test
    validPassword: () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      
      // Assicura almeno una maiuscola, una minuscola, un numero e un carattere speciale
      password += chars.charAt(Math.floor(Math.random() * 26)); // Maiuscola
      password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Minuscola
      password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Numero
      password += chars.charAt(62 + Math.floor(Math.random() * 8)); // Carattere speciale
      
      // Aggiungi caratteri casuali per raggiungere 8 caratteri
      for (let i = 4; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Mischia i caratteri
      return password.split('').sort(() => Math.random() - 0.5).join('');
    },
    
    // Genera indirizzo completo per test
    completeAddress: () => {
      const cities = ['Milano', 'Roma', 'Napoli', 'Torino', 'Palermo'];
      const caps = ['20100', '00100', '80100', '10100', '90100'];
      const streets = ['Via Roma', 'Via Milano', 'Via Napoli', 'Via Torino', 'Via Palermo'];
      
      return {
        citta: cities[Math.floor(Math.random() * cities.length)],
        cap: caps[Math.floor(Math.random() * caps.length)],
        via: streets[Math.floor(Math.random() * streets.length)],
        civico: Math.floor(Math.random() * 200) + 1
      };
    }
  }
};

// Applica la configurazione all'avvio
if (require.main === module) {
  console.log('🔧 Test environment configured:');
  console.log(`   Database: ${testConfig.MONGO_URI}`);
  console.log(`   Port: ${testConfig.PORT}`);
  console.log(`   JWT Secret: ${testConfig.JWT_SECRET ? '***' : 'Not set'}`);
  console.log(`   Security Controls: ${testConfig.ENABLE_SECURITY_CONTROLS ? 'Enabled' : 'Disabled'}`);
}
