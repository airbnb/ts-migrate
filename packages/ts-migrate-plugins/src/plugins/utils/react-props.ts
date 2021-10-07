/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define, no-restricted-syntax */
import ts from 'typescript';
import { getNumComponentsInSourceFile } from './react';
import { collectIdentifiers } from './identifiers';
import { PropTypesIdentifierMap } from '../react-props';

export type PropsTypeNode = ts.TypeLiteralNode | ts.IntersectionTypeNode;

type Params = {
  anyAlias?: string;
  anyFunctionAlias?: string;
  implicitChildren?: boolean;
  spreadReplacements: { spreadId: string; typeRef: ts.TypeReferenceNode }[];
  propTypeIdentifiers?: PropTypesIdentifierMap;
};

export default function getTypeFromPropTypesObjectLiteral(
  objectLiteral: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile,
  params: Params,
) {
  const members: ts.PropertySignature[] = [];
  const intersectionTypes: ts.TypeReferenceNode[] = [];
  const unhandledProperties: ts.ObjectLiteralElementLike[] = [];
  const comments: string[] = [];

  for (const property of objectLiteral.properties) {
    let handled = false;
    if (ts.isPropertyAssignment(property)) {
      if (params.implicitChildren && property.name.getText(sourceFile) === 'children') {
        handled = true;
      } else {
        const prop = convertPropertyAssignment(property, sourceFile, params);
        if (prop) {
          members.push(prop);
          handled = true;
        }
      }
    } else if (ts.isSpreadAssignment(property) && ts.isIdentifier(property.expression)) {
      const spreadId = property.expression.text;
      const replacement = params.spreadReplacements.find((cur) => cur.spreadId === spreadId);
      if (replacement) {
        intersectionTypes.push(replacement.typeRef);
        handled = true;
      }
    }

    if (!handled) {
      unhandledProperties.push(property);
      comments.push(property.getText(sourceFile));
    }
  }

  let node: ts.TypeLiteralNode | ts.IntersectionTypeNode =
    ts.factory.createTypeLiteralNode(members);
  if (intersectionTypes.length > 0) {
    node = ts.factory.createIntersectionTypeNode([node, ...intersectionTypes]);
  }
  if (comments.length > 0) {
    node = ts.addSyntheticLeadingComment(
      node,
      ts.SyntaxKind.MultiLineCommentTrivia,
      `
(ts-migrate) TODO: Migrate the remaining prop types
${comments.join('\n')}
`,
      true,
    );
  }

  return node;
}

function convertPropertyAssignment(
  propertyAssignment: ts.PropertyAssignment,
  sourceFile: ts.SourceFile,
  params: Params,
) {
  const name = propertyAssignment.name.getText(sourceFile);
  const { initializer } = propertyAssignment;

  let typeExpression: ts.Expression;
  let isRequired: boolean;
  if (
    ts.isPropertyAccessExpression(initializer) &&
    /\.isRequired/.test(initializer.getText(sourceFile))
  ) {
    typeExpression = initializer.expression;
    isRequired = true;
  } else {
    typeExpression = initializer;
    isRequired = false;
  }

  const typeNode = getTypeFromPropTypeExpression(typeExpression, sourceFile, params);

  let propertySignature = ts.factory.createPropertySignature(
    undefined,
    name,
    isRequired ? undefined : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
    typeNode,
  );
  propertySignature = ts.moveSyntheticComments(propertySignature, typeNode);
  return propertySignature;
}

function getTypeFromPropTypeExpression(
  node: ts.Expression,
  sourceFile: ts.SourceFile,
  params: Params,
): ts.TypeNode {
  const { anyAlias, anyFunctionAlias } = params;

  let text = node.getText(sourceFile).replace(/React\.PropTypes\./, '');
  const isDestructuredProptypeImport =
    params.propTypeIdentifiers && ts.isIdentifier(node) && params.propTypeIdentifiers[text];

  let result = null;
  if (ts.isPropertyAccessExpression(node) || isDestructuredProptypeImport) {
    if (isDestructuredProptypeImport && params.propTypeIdentifiers) {
      text = params.propTypeIdentifiers[text];
    }
    /**
     * PropTypes.array,
     * PropTypes.bool,
     * PropTypes.func,
     * PropTypes.number,
     * PropTypes.object,
     * PropTypes.string,
     * PropTypes.symbol, (ignore)
     * PropTypes.node,
     * PropTypes.element,
     * PropTypes.any,
     */
    if (/string/.test(text)) {
      result = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    } else if (/any/.test(text)) {
      if (anyAlias) {
        result = ts.factory.createTypeReferenceNode(anyAlias, undefined);
      } else {
        result = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      }
    } else if (/array/.test(text)) {
      if (anyAlias) {
        result = ts.factory.createArrayTypeNode(
          ts.factory.createTypeReferenceNode(anyAlias, undefined),
        );
      } else {
        result = ts.factory.createArrayTypeNode(
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        );
      }
    } else if (/bool/.test(text)) {
      result = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    } else if (/number/.test(text)) {
      result = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    } else if (/object/.test(text)) {
      if (anyAlias) {
        result = ts.factory.createTypeReferenceNode(anyAlias, undefined);
      } else {
        result = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      }
    } else if (/node/.test(text)) {
      result = ts.factory.createTypeReferenceNode('React.ReactNode', undefined);
    } else if (/element/.test(text)) {
      result = ts.factory.createTypeReferenceNode('React.ReactElement', undefined);
    } else if (/func/.test(text)) {
      if (anyFunctionAlias) {
        result = ts.factory.createTypeReferenceNode(anyFunctionAlias, undefined);
      } else if (anyAlias) {
        result = ts.factory.createFunctionTypeNode(
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
              'args',
              undefined,
              ts.factory.createArrayTypeNode(
                ts.factory.createTypeReferenceNode(anyAlias, undefined),
              ),
              undefined,
            ),
          ],
          ts.factory.createTypeReferenceNode(anyAlias, undefined),
        );
      } else {
        result = ts.factory.createFunctionTypeNode(
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
              'args',
              undefined,
              ts.factory.createArrayTypeNode(
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
              ),
              undefined,
            ),
          ],
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        );
      }
    }
  } else if (ts.isCallExpression(node)) {
    /**
     * PropTypes.instanceOf(), (ignore)
     * PropTypes.oneOf(), // only support oneOf([1, 2]), oneOf(['a', 'b'])
     * PropTypes.oneOfType(),
     * PropTypes.arrayOf(),
     * PropTypes.objectOf(),
     * PropTypes.shape(),
     */
    const expressionText = node.expression.getText(sourceFile);
    if (/oneOf$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (ts.isArrayLiteralExpression(argument)) {
        if (argument.elements.every((elm) => ts.isStringLiteral(elm) || ts.isNumericLiteral(elm))) {
          result = ts.factory.createUnionTypeNode(
            (argument.elements as ts.NodeArray<ts.StringLiteral | ts.NumericLiteral>).map((elm) =>
              ts.factory.createLiteralTypeNode(elm),
            ),
          );
        }
      }
    } else if (/oneOfType$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (ts.isArrayLiteralExpression(argument)) {
        const children: ts.Node[] = [];
        result = ts.factory.createUnionTypeNode(
          argument.elements.map((elm) => {
            const child = getTypeFromPropTypeExpression(elm, sourceFile, params);
            children.push(child);
            return child;
          }),
        );
        for (const child of children) {
          result = ts.moveSyntheticComments(result, child);
        }
      }
    } else if (/arrayOf$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (argument) {
        const child = getTypeFromPropTypeExpression(argument, sourceFile, params);
        result = ts.factory.createArrayTypeNode(child);
        result = ts.moveSyntheticComments(result, child);
      }
    } else if (/objectOf$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (argument) {
        const child = getTypeFromPropTypeExpression(argument, sourceFile, params);
        result = ts.factory.createTypeLiteralNode([
          ts.factory.createIndexSignature(
            undefined,
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                'key',
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
              ),
            ],
            child,
          ),
        ]);
        result = ts.moveSyntheticComments(result, child);
      }
    } else if (/shape$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (argument && ts.isObjectLiteralExpression(argument)) {
        return getTypeFromPropTypesObjectLiteral(argument, sourceFile, params);
      }
    }
  } else if (ts.isIdentifier(node) && node.text === 'textlike') {
    result = ts.factory.createUnionTypeNode([
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ts.factory.createTypeReferenceNode('React.ReactNode', undefined),
    ]);
  } else if (ts.isIdentifier(node)) {
    result = ts.factory.createTypeReferenceNode(node.text, undefined);
  }

  /**
   * customProp,
   * anything others
   */
  if (!result) {
    if (anyAlias) {
      result = ts.factory.createTypeReferenceNode(anyAlias, undefined);
    } else {
      result = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    }

    // Add comment about what the original proptype was.
    result = ts.addSyntheticTrailingComment(
      result,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` TODO: ${text
        .split('\n')
        .map((line) => line.trim())
        .join(' ')}`,
      true,
    );
  }

  return result;
}

export function createPropsTypeNameGetter(sourceFile: ts.SourceFile) {
  const numComponentsInFile = getNumComponentsInSourceFile(sourceFile);
  const usedIdentifiers = collectIdentifiers(sourceFile);

  const getPropsTypeName = (componentName: string | undefined) => {
    let name = '';
    if (componentName && numComponentsInFile > 1) {
      name = `${componentName}Props`;
    } else {
      name = 'Props';
    }

    if (!usedIdentifiers.has(name)) {
      return name;
    }

    // Ensure name is unused.
    let i = 1;
    while (usedIdentifiers.has(name + i)) {
      i += 1;
    }
    return name + i;
  };

  return getPropsTypeName;
}
