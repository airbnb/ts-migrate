const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '../../..'),
  runner: path.resolve(__dirname, '../runner/reignore/index.js'),
  displayName: 'reignore',
  testEnvironment: 'node',
  moduleFileExtensions: ['json'],
  testMatch: ['<rootDir>/frontend/*/tsconfig.json'],
};
