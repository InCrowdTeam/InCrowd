module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFiles: [
    '<rootDir>/test.env.js',
    '<rootDir>/test.setup.js'
  ],
  moduleDirectories: [
    'node_modules',
    '../node_modules'
  ],
  testMatch: [
    '**/*.test.js',
    '__tests__/**/*.test.js'
  ]
};
