import { validatePassword } from './src/utils/passwordValidator.js';

// Test con password forti
const testPasswords = [
  'Password123!',
  'MyStrongPass123@',
  'SecureP@ssw0rd',
  'Test1234!',
  'ComplexPassword2024@'
];

console.log('Testing password validation:');
testPasswords.forEach(password => {
  const result = validatePassword(password);
  console.log(`\nPassword: "${password}"`);
  console.log(`Valid: ${result.isValid}`);
  console.log(`Strength: ${result.strength}`);
  if (result.errors.length > 0) {
    console.log(`Errors: ${result.errors.join(', ')}`);
  }
});
