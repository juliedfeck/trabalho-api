module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  maxWorkers: 1,
}
