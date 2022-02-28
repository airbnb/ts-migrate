import { Plugin } from 'ts-migrate-server';

type Options = { shouldReplaceText?: boolean };

const examplePluginTsMorph: Plugin<Options> = {
  name: 'example-plugin-ts-morph',
  async run({ sourceFile }) {
    // get all function declarations from the source file
    const functionDeclarations = sourceFile.getFunctions();

    functionDeclarations.forEach((functionDeclaration) => {
      const name = functionDeclaration.getName();

      // add a jsDoc comment before the function
      functionDeclaration.addJsDoc({
        description: `This is the function ${name}`,
      });
    });

    sourceFile.formatText({
      indentSize: 2,
    });

    sourceFile.saveSync();

    return sourceFile.getFullText();
  },
};

export default examplePluginTsMorph;
