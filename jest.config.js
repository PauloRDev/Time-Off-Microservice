module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/**/*.module.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: { branches: 80, functions: 85, lines: 85, statements: 85 }
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '@modules/(.*)': '<rootDir>/src/modules/$1',
    '@common/(.*)': '<rootDir>/src/common/$1',
    '@config/(.*)': '<rootDir>/src/config/$1',
    '@database/(.*)': '<rootDir>/src/database/$1'
  },
  setupFilesAfterEnv: []  ,
  testTimeout: 30000
};