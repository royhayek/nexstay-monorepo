module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
        },
        useESM: false,
      },
    ],
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/test/**',
    '!**/__mocks__/**',
    '!**/migrations/**',
    '!**/seeds/**',
    '!main.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'json-summary', 'html'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@faker-js/faker$': '<rootDir>/../node_modules/@faker-js/faker/dist/cjs',
  },
  extensionsToTreatAsEsm: ['.ts'],
  silent: false,
  verbose: false,
};