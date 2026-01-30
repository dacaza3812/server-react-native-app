module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverage: true,
  collectCoverageFrom: ['controllers/**/*.js', 'models/**/*.js', 'routes/**/*.js', 'middleware/**/*.js', 'utils/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', 'errors/', 'config/', 'app.js', 'server.js'],
  coverageDirectory: 'coverage',
  verbose: true,
  forceExit: true,
};