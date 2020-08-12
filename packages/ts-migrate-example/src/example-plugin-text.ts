import { Plugin } from 'ts-migrate-server';

type Options = {};

const examplePluginText: Plugin<Options> = {
  name: 'example-plugin-text',
  async run({ text }) {
    // will add a console.log before each return statement
    const returnIndex = text.indexOf('return');
    // eslint-disable-next-line no-template-curly-in-string
    const logBeforeReturnStatement = 'console.log(`args: ${arguments}`)\n';
    if (returnIndex > -1) {
      const newText =
        text.substring(0, returnIndex) + logBeforeReturnStatement + text.substr(returnIndex);
      return newText;
    }
    return text;
  },
};

export default examplePluginText;
