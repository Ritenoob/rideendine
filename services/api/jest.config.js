module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: 'src',

  // Test file patterns
  testRegex: '.*\\.spec\\.ts$',

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Transform files with ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Coverage collection patterns
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/node_modules/**',
  ],

  // Coverage directory
  coverageDirectory: '../coverage',

  // Coverage thresholds - fail if coverage falls below these values
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@ridendine/shared/(.*)$': '<rootDir>/../../packages/shared/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Test timeout (30 seconds for database tests)
  testTimeout: 30000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Verbose output
  verbose: true,

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Setup files (run before each test file)
  // setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],

  // Global setup (run once before all tests)
  // globalSetup: '<rootDir>/../test/global-setup.ts',

  // Global teardown (run once after all tests)
  // globalTeardown: '<rootDir>/../test/global-teardown.ts',

  // Maximum number of workers
  maxWorkers: '50%',

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  // Watch ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],
};
