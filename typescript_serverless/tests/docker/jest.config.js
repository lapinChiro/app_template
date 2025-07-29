/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../..',
  testMatch: ['<rootDir>/tests/docker/**/*.test.ts'],
  collectCoverageFrom: [
    'tests/docker/**/*.ts',
    '!tests/docker/**/*.test.ts',
  ],
  coverageDirectory: 'coverage/docker',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};