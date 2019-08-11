module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '\\.js$': '<rootDir>/src/jest-flow-transform.js',
  },
};
