import { CLIEngine } from 'eslint';
import { Plugin } from 'ts-migrate-server';

const cli = new CLIEngine({
  fix: true,
  useEslintrc: true,
  // Set ignore to false so we can lint in `tmp` for testing
  ignore: false,
});

const eslintFixPlugin: Plugin = {
  name: 'eslint-fix',
  run({ fileName, text }) {
    try {
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
    } catch (e) {
      console.error('Error occurred in eslint-fix plugin :(');
      return text;
    }
  },
};

export default eslintFixPlugin;
