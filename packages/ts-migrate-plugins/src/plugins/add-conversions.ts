import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import { isDiagnosticWithLinePosition } from '../utils/type-guards';
import getTokenAtPosition from './utils/token-pos';
import { AnyAliasOptions, validateAnyAliasOptions } from '../utils/validateOptions';
import UpdateTracker from './utils/update';

type Options = AnyAliasOptions;

const supportedDiagnostics = new Set([
  // TS2339: Property '{0}' does not exist on type '{1}'.
  2339,
  // TS2571: Object is of type 'unknown'.
  2571,
]);

const addConversionsPlugin: Plugin<Options> = {
  name: 'add-conversions',

  run({ fileName, sourceFile, options, getLanguageService }) {
    // Filter out diagnostics we care about.
    const diags = getLanguageService()
      .getSemanticDiagnostics(fileName)
      .filter(isDiagnosticWithLinePosition)
      .filter((diag) => supportedDiagnostics.has(diag.code));

    const updates = new UpdateTracker(sourceFile);
    ts.transform(sourceFile, [addConversionsTransformerFactory(updates, diags, options)]);
    return updates.apply();
  },

  validate: validateAnyAliasOptions,
};

export default addConversionsPlugin;

const addConversionsTransformerFactory =
  (updates: UpdateTracker, diags: ts.DiagnosticWithLocation[], { anyAlias }: Options) =>
  (context: ts.TransformationContext) => {
    const { factory } = context;
    const anyType = anyAlias
      ? factory.createTypeReferenceNode(anyAlias)
      : factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

    let nodesToConvert: Set<ts.Node>;
    const ancestorReplaceMap = new Map<ts.Node, boolean>();
    return (file: ts.SourceFile) => {
      nodesToConvert = new Set(
        diags
          .map((diag) => {
            const token = getTokenAtPosition(file, diag.start);
            switch (diag.code) {
              case 2339:
                if (!ts.isPropertyAccessExpression(token.parent)) {
                  return null;
                }
                return token.parent.expression;

              case 2571:
                return token;

              default:
                // Should be impossible.
                return null;
            }
          })
          .filter((node): node is ts.Expression => node !== null),
      );
      visit(file);
      return file;
    };

    function visit(origNode: ts.Node): ts.Node | undefined {
      const ancestorShouldBeReplaced = ancestorReplaceMap.get(origNode.parent);
      ancestorReplaceMap.set(
        origNode,
        ancestorShouldBeReplaced === undefined
          ? origNode.kind === ts.SyntaxKind.ExpressionStatement
          : origNode.kind === ts.SyntaxKind.ExpressionStatement || ancestorShouldBeReplaced,
      );

      const needsConversion = nodesToConvert.has(origNode);
      let node = ts.visitEachChild(origNode, visit, context);
      if (node === origNode && !needsConversion) {
        return origNode;
      }

      if (needsConversion) {
        node = factory.createAsExpression(node as ts.Expression, anyType);
      }

      if (shouldReplace(node) && !ancestorShouldBeReplaced) {
        replaceNode(origNode, node);
        return origNode;
      }

      return node;
    }

    // Nodes that have one expression child called "expression".
    type ExpressionChild =
      | ts.DoStatement
      | ts.IfStatement
      | ts.SwitchStatement
      | ts.WithStatement
      | ts.WhileStatement;

    /**
     * For nodes that contain both expression and statement children, only
     * replace the direct expression children. The statements have already
     * been replaced at a lower level and replacing them again can produce
     * duplicate statements or invalid syntax.
     */
    function replaceNode(origNode: ts.Node, newNode: ts.Node): void {
      switch (origNode.kind) {
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.SwitchStatement:
        case ts.SyntaxKind.WithStatement:
        case ts.SyntaxKind.WhileStatement:
          updates.replaceNode(
            (origNode as ExpressionChild).expression,
            (newNode as ExpressionChild).expression,
          );
          break;

        case ts.SyntaxKind.ForStatement:
          updates.replaceNode(
            (origNode as ts.ForStatement).initializer,
            (newNode as ts.ForStatement).initializer,
          );
          updates.replaceNode(
            (origNode as ts.ForStatement).condition,
            (newNode as ts.ForStatement).condition,
          );
          updates.replaceNode(
            (origNode as ts.ForStatement).incrementor,
            (newNode as ts.ForStatement).incrementor,
          );
          break;

        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
          updates.replaceNode(
            (origNode as ts.ForInOrOfStatement).expression,
            (newNode as ts.ForInOrOfStatement).expression,
          );
          updates.replaceNode(
            (origNode as ts.ForInOrOfStatement).initializer,
            (newNode as ts.ForInOrOfStatement).initializer,
          );
          break;

        default:
          updates.replaceNode(origNode, newNode);
          break;
      }
    }
  };

/**
 * Determines whether a node is eligible to be replaced.
 *
 * Replacing only the expression may produce invalid syntax due to missing parentheses.
 * There is still some risk of losing whitespace if the expression is contained within
 * an if statement condition or other construct that can contain blocks.
 */
function shouldReplace(node: ts.Node): boolean {
  if (isStatement(node)) {
    return true;
  }
  switch (node.kind) {
    case ts.SyntaxKind.CaseClause:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.EnumMember:
    case ts.SyntaxKind.HeritageClause:
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.SourceFile: // In case we missed any other case.
      return true;
    default:
      return false;
  }
}

function isStatement(node: ts.Node): node is ts.Statement {
  return ts.SyntaxKind.FirstStatement <= node.kind && node.kind <= ts.SyntaxKind.LastStatement;
}
