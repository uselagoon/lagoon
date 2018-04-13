module.exports = {
  rootDir: '.',
  testPathIgnorePatterns: ['node_modules', '<rootDir>/dist'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};
