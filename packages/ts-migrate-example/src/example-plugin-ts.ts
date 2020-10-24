import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import { updateSourceText, SourceTextUpdate } from 'ts-migrate-plugins';

type Options = { shouldReplaceText?: boolean };

const examplePluginTs: Plugin<Options> = {
  name: 'example-plugin-ts',
  async run({ sourceFile, text, options }) {
    // array with source text updates
    const updates: SourceTextUpdate[] = [];
    const printer = ts.createPrinter();

    // get all function declarations from the source file
    const functionDeclarations = sourceFile.statements.filter(ts.isFunctionDeclaration);

    functionDeclarations.forEach((functionDeclaration) => {
      const hasTwoParams = functionDeclaration.parameters.length === 2;
      // check if return statement of the function is "x*y"
      const multiplierReturn =
        functionDeclaration.body &&
        functionDeclaration.body.statements.find(
          (statement) =>
            ts.isReturnStatement(statement) &&
            statement.expression &&
            ts.isBinaryExpression(statement.expression) &&
            statement.expression.operatorToken.kind === ts.SyntaxKind.AsteriskToken,
        );

      if (options.shouldReplaceText && hasTwoParams && multiplierReturn) {
        // create a new function declaration with a new type
        const newFunctionDeclaration = ts.factory.createFunctionDeclaration(
          functionDeclaration.decorators,
          functionDeclaration.modifiers,
          functionDeclaration.asteriskToken,
          functionDeclaration.name,
          functionDeclaration.typeParameters,
          functionDeclaration.parameters.map((x) =>
            ts.factory.createParameterDeclaration(
              x.decorators,
              x.modifiers,
              x.dotDotDotToken,
              x.name,
              x.questionToken,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
              x.initializer,
            ),
          ),
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
          functionDeclaration.body,
        );

        const start = functionDeclaration.pos;
        const { end } = functionDeclaration;

        // generate a new source text for the function declaration
        const text = printer.printNode(ts.EmitHint.Unspecified, newFunctionDeclaration, sourceFile);

        updates.push({ kind: 'replace', index: start, length: end - start, text });
      }
    });
    return updateSourceText(text, updates);
  },
};

export default examplePluginTs;
