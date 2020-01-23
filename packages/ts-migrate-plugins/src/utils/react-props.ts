/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define, no-restricted-syntax */
import ts from 'typescript';
import { getNumComponentsInSourceFile } from './react';
import { collectIdentifiers } from './identifiers';

export type PropsTypeNode = ts.TypeLiteralNode | ts.IntersectionTypeNode;

type Params = {
  anyAlias?: string;
  anyFunctionAlias?: string;
  implicitChildren?: boolean;
  spreadReplacements: { spreadId: string; typeRef: ts.TypeReferenceNode }[];
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

  let node: ts.TypeLiteralNode | ts.IntersectionTypeNode = ts.createTypeLiteralNode(members);
  if (intersectionTypes.length > 0) {
    node = ts.createIntersectionTypeNode([node, ...intersectionTypes]);
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

  let propertySignature = ts.createPropertySignature(
    undefined,
    name,
    isRequired ? undefined : ts.createToken(ts.SyntaxKind.QuestionToken),
    typeNode,
    undefined,
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

  const text = node.getText(sourceFile).replace(/React\.PropTypes\./, '');

  let result = null;
  if (ts.isPropertyAccessExpression(node)) {
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
      result = ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    } else if (/any/.test(text)) {
      if (anyAlias) {
        result = ts.createTypeReferenceNode(anyAlias, undefined);
      } else {
        result = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      }
    } else if (/array/.test(text)) {
      if (anyAlias) {
        result = ts.createArrayTypeNode(ts.createTypeReferenceNode(anyAlias, undefined));
      } else {
        result = ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
      }
    } else if (/bool/.test(text)) {
      result = ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    } else if (/number/.test(text)) {
      result = ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    } else if (/object/.test(text)) {
      if (anyAlias) {
        result = ts.createTypeReferenceNode(anyAlias, undefined);
      } else {
        result = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      }
    } else if (/node/.test(text)) {
      result = ts.createTypeReferenceNode('React.ReactNode', undefined);
    } else if (/element/.test(text)) {
      result = ts.createTypeReferenceNode('React.ReactElement', undefined);
    } else if (/func/.test(text)) {
      if (anyFunctionAlias) {
        result = ts.createTypeReferenceNode(anyFunctionAlias, undefined);
      } else if (anyAlias) {
        result = ts.createFunctionTypeNode(
          undefined,
          [
            ts.createParameter(
              undefined,
              undefined,
              ts.createToken(ts.SyntaxKind.DotDotDotToken),
              'args',
              undefined,
              ts.createArrayTypeNode(ts.createTypeReferenceNode(anyAlias, undefined)),
              undefined,
            ),
          ],
          ts.createTypeReferenceNode(anyAlias, undefined),
        );
      } else {
        result = ts.createFunctionTypeNode(
          undefined,
          [
            ts.createParameter(
              undefined,
              undefined,
              ts.createToken(ts.SyntaxKind.DotDotDotToken),
              'args',
              undefined,
              ts.createArrayTypeNode(ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
              undefined,
            ),
          ],
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
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
          result = ts.createUnionTypeNode(
            (argument.elements as ts.NodeArray<ts.StringLiteral | ts.NumericLiteral>).map((elm) =>
              ts.createLiteralTypeNode(elm),
            ),
          );
        }
      }
    } else if (/oneOfType$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (ts.isArrayLiteralExpression(argument)) {
        const children: ts.Node[] = [];
        result = ts.createUnionOrIntersectionTypeNode(
          ts.SyntaxKind.UnionType,
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
        result = ts.createArrayTypeNode(child);
        result = ts.moveSyntheticComments(result, child);
      }
    } else if (/objectOf$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (argument) {
        const child = getTypeFromPropTypeExpression(argument, sourceFile, params);
        result = ts.createTypeLiteralNode([
          ts.createIndexSignature(
            undefined,
            undefined,
            [
              ts.createParameter(
                undefined,
                undefined,
                undefined,
                'key',
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
              ),
            ],
            child,
          ),
        ]);
        result = ts.moveSyntheticComments(result, child);
      }
    } else if (/shape$/.test(expressionText)) {
      const argument = node.arguments[0];
      if (ts.isObjectLiteralExpression(argument)) {
        return getTypeFromPropTypesObjectLiteral(argument, sourceFile, params);
      }
    }
  } else if (ts.isIdentifier(node) && node.text === 'textlike') {
    result = ts.createUnionTypeNode([
      ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      ts.createTypeReferenceNode('React.ReactNode', undefined),
    ]);
  } else if (ts.isIdentifier(node)) {
    result = ts.createTypeReferenceNode(node.text, undefined);
  }

  /**
   * customProp,
   * anything others
   */
  if (!result) {
    if (anyAlias) {
      result = ts.createTypeReferenceNode(anyAlias, undefined);
    } else {
      result = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
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
