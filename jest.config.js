module.exports = {
  preset: 'react-native',
  // Solo archivos *.test.ts(x). Evita que helpers/mocks en __tests__/ se
  // ejecuten como suites.
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
