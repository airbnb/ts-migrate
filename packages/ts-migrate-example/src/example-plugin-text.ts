import { Plugin } from 'ts-migrate-server'

type Options = {};

const examplePluginText: Plugin<Options> = {
  name: 'example-plugin-text',
  async run({ text }) {
    // will add a console.log before each return statement
    const returnIndex = text.indexOf('return');
    const logBeforeReturnStatement = "console.log(`a: ${a}, b: ${b}`)\n";
    if (returnIndex > -1) {
      const newText = text.substring(0, returnIndex) + logBeforeReturnStatement + text.substr(returnIndex + 1)
      return newText;
    } else {
      return text;
    }
  },
};

export default examplePluginText;