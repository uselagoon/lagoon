module.exports = {
  rootDir: '.',
  testPathIgnorePatterns: ['node_modules', '<rootDir>/build'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
};
