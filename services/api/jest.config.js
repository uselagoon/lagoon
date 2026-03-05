module.exports = {
  roots: ['./src'],
  testEnvironment: 'node',
  transform: {
    '^.+\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  testPathIgnorePatterns: ['node_modules'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // mariadb 3.x and node-fetch 3.x ship as ESM which Jest (CJS mode) cannot parse.
  // redis v3 creates a live connection on import, keeping the test runner open.
  // Redirect all three to manual mocks in __mocks__/.
  moduleNameMapper: {
    '^mariadb(/.*)?$': '<rootDir>/__mocks__/mariadb.js',
    '^node-fetch$': '<rootDir>/__mocks__/node-fetch.js',
    '^redis$': '<rootDir>/__mocks__/redis.js',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js}',
    '!src/**/*.test.{ts,tsx,js}',
    '!src/**/__tests__/**',
    '!src/**/__snapshots__/**',
    '!src/mocks.js',
    '!src/typeDefs.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
};

