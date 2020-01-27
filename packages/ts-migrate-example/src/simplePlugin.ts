import ts from 'typescript';
import { Plugin } from 'ts-migrate-server'
import { updateSourceText, SourceTextUpdate } from 'ts-migrate-plugins';

type Options = { shouldReplaceText?: boolean };

const simplePlugin: Plugin<Options> = {
  name: 'simple-plugin',
  async run({ sourceFile, text, options }) {
    const updates: SourceTextUpdate[] = [];
    const printer = ts.createPrinter();

    const functionDeclarations = sourceFile.statements.filter(ts.isFunctionDeclaration);

    functionDeclarations.forEach(functionDeclaration => {
      const hasTwoParams = functionDeclaration.parameters.length === 2;
      const multiplierReturn = functionDeclaration.body
        && functionDeclaration.body.statements.find(statement =>
          ts.isReturnStatement(statement)
          && statement.expression
          && ts.isBinaryExpression(statement.expression)
          && statement.expression.operatorToken.kind === ts.SyntaxKind.AsteriskToken
        );

      // console.log(options.shouldReplaceText, hasTwoParams, multiplierReturn)

      if (options.shouldReplaceText && hasTwoParams && multiplierReturn) {
        const newFunctionDeclaration = ts.createFunctionDeclaration(
          functionDeclaration.decorators,
          functionDeclaration.modifiers,
          functionDeclaration.asteriskToken,
          functionDeclaration.name,
          functionDeclaration.typeParameters,
          functionDeclaration.parameters.map(x =>
            ts.createParameter(
              x.decorators,
              x.modifiers,
              x.dotDotDotToken,
              x.name,
              x.questionToken,
              ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
              x.initializer,
            )
          ),
          ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
          functionDeclaration.body,
        )

        const start = functionDeclaration.pos;
        const { end } = functionDeclaration;

        let text = printer.printNode(
          ts.EmitHint.Unspecified,
          newFunctionDeclaration,
          sourceFile,
        );

        updates.push({ kind: 'replace', index: start, length: end - start, text });
      }

    });
    return updateSourceText(text, updates);
  },
};

export default simplePlugin;
