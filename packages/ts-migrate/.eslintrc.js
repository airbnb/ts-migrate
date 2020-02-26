require('eslint-config-ts-migrate/patch-eslint6')

module.exports = {
  extends: ["ts-migrate"],
  parserOptions: { tsconfigRootDir: __dirname },
};