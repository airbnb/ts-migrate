import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import { isDiagnosticWithLinePosition } from '../utils/type-guards';
import getTokenAtPosition from './utils/token-pos';

type Options = {
  anyAlias?: string;
};

const addConversionsPlugin: Plugin<Options> = {
  name: 'add-conversions',
  run({ fileName, sourceFile, text, options, getLanguageService }) {
    // Filter out TS2339: Property '{0}' does not exist on type '{1}'.
    const diags = getLanguageService()
      .getSemanticDiagnostics(fileName)
      .filter(isDiagnosticWithLinePosition)
      .filter((diag) => diag.code === 2339);

    const result = ts.transform(sourceFile, [addConversionsTransformerFactory(diags, options)]);
    const newSourceFile = result.transformed[0];
    if (newSourceFile === sourceFile) {
      return text;
    }
    const printer = ts.createPrinter();
    return printer.printFile(newSourceFile);
  },
};

export default addConversionsPlugin;

const addConversionsTransformerFactory = (
  diags: ts.DiagnosticWithLocation[],
  { anyAlias }: Options,
) => (context: ts.TransformationContext) => {
  const { factory } = context;
  const anyType = anyAlias
    ? factory.createTypeReferenceNode(anyAlias)
    : factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

  let nodesToConvert: Set<ts.Node>;

  return (file: ts.SourceFile) => {
    nodesToConvert = new Set(
      diags
        .map((diag) => {
          const token = getTokenAtPosition(file, diag.start);
          if (!ts.isPropertyAccessExpression(token.parent)) {
            return null;
          }
          return token.parent.expression;
        })
        .filter((node): node is ts.LeftHandSideExpression => node !== null),
    );
    return ts.visitNode(file, visit);
  };

  function visit(origNode: ts.Node): ts.Node {
    const needsConversion = nodesToConvert.has(origNode);
    const node = ts.visitEachChild(origNode, visit, context);
    if (!needsConversion) {
      return node;
    }

    return factory.createAsExpression(node as ts.Expression, anyType);
  }
};
