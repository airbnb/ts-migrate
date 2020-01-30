import { CLIEngine } from 'eslint';
import { Plugin } from '../../types';

// Require eslintrc to set RULES_DIR to avoid the following error:
// Error: To use eslint-plugin-rulesdir, you must load it beforehand and set the `RULES_DIR` property on the module to a string.
require('../.eslintrc');

const cli = new CLIEngine({
  fix: true,
  useEslintrc: true,
  // Set ignore to false so we can lint in `tmp` for testing
  ignore: false,
});

const eslintFixPlugin: Plugin = {
  name: 'eslint-fix',
  run({ fileName, text }) {
    let newText = text;
    while (true) {
      const report = cli.executeOnText(newText, fileName);
      const result = report.results.find((cur) => cur.filePath === fileName);
      if (!result || !result.output || result.output === newText) {
        break;
      }

      newText = result.output;
    }

    return newText;
  },
};

export default eslintFixPlugin;
