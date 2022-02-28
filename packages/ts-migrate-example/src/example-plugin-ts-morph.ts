import { Plugin } from 'ts-migrate-server';

type Options = { shouldReplaceText?: boolean };

const examplePluginTsMorph: Plugin<Options> = {
  name: 'example-plugin-ts-morph',
  async run({ tsMorphSourceFile }) {
    // get all function declarations from the source file
    const functionDeclarations = tsMorphSourceFile.getFunctions();

    functionDeclarations.forEach((functionDeclaration) => {
      const name = functionDeclaration.getName();

      // add a jsDoc comment before the function
      functionDeclaration.addJsDoc({
        description: `This is the function ${name}`,
      });
    });

    tsMorphSourceFile.formatText({
      indentSize: 2,
    });

    tsMorphSourceFile.saveSync();

    return tsMorphSourceFile.getFullText();
  },
};

export default examplePluginTsMorph;
