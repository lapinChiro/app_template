module.exports = {
  projects: [
    '<rootDir>/packages/*/jest.config.js',
    '<rootDir>/apps/*/jest.config.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
};