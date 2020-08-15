const path = require('path');
const { execSync } = require('child_process');
const { pass, fail } = require('create-jest-runner');

const cli = path.resolve(__dirname, '../../build/ts-migrate.js');

module.exports = ({ testPath, config }) => {
  const folder = path.relative(config.rootDir, testPath).replace('/tsconfig.json', '');

  const start = Date.now();
  let errorMessage;
  try {
    execSync(`${cli} reignore ${folder}`, { encoding: 'utf8' });
  } catch (error) {
    errorMessage = `${error.message}
${error.stdout}`;
  }
  const end = Date.now();

  if (errorMessage) {
    return fail({ start, end, test: { path: testPath, errorMessage } });
  }

  return pass({ start, end, test: { path: testPath } });
};
