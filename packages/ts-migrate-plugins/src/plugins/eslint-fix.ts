import { ESLint } from 'eslint';
import { Plugin } from 'ts-migrate-server';

const cli = new ESLint({
  fix: true,
  useEslintrc: true,
  // Set ignore to false so we can lint in `tmp` for testing
  ignore: false,
});

const eslintFixPlugin: Plugin = {
  name: 'eslint-fix',
  async run({ fileName, text }) {
    try {
      let newText = text;
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const [report] = await cli.lintText(newText, {
          filePath: fileName,
        });

        if (!report || !report.output || report.output === newText) {
          break;
        }
        newText = report.output;
      }
      return newText;
    } catch (e) {
      if (e instanceof Error) {
        console.error('Error occurred in eslint-fix plugin: ', e.message);
      }
      return text;
    }
  },
};

export default eslintFixPlugin;
