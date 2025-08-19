module.exports = {
  // Ambiente di test
  testEnvironment: 'node',
  
  // Estensioni dei file da testare
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // File da ignorare
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Timeout per i test (30 secondi per le chiamate API)
  testTimeout: 30000,
  
  // Setup e teardown
  setupFilesAfterEnv: ['<rootDir>/test.setup.js'],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/index.ts'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }]
  ],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Collect coverage
  collectCoverage: false,
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage report types
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'json',
    'ts'
  ],
  
  // Transform files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Test environment variables
  setupFiles: ['<rootDir>/test.env.js'],
  
  // Maximum workers
  maxWorkers: 1,
  
  // Force exit after tests
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Handle cleanup
  handleExit: true
};
