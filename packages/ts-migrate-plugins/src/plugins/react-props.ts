/* eslint-disable no-restricted-syntax, no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import {
  isReactClassComponent,
  getReactComponentHeritageType,
  isReactSfcFunctionDeclaration,
  isReactSfcArrowFunction,
  isReactForwardRefName,
} from './utils/react';
import isNotNull from '../utils/isNotNull';
import updateSourceText, { SourceTextUpdate } from '../utils/updateSourceText';
import getTypeFromPropTypesObjectLiteral, { createPropsTypeNameGetter } from './utils/react-props';
import { getTextPreservingWhitespace } from './utils/text';
import { updateImports, DefaultImport, NamedImport } from './utils/imports';
import {
  AnyAliasOptions,
  AnyFunctionAliasOptions,
  Properties,
  anyAliasProperty,
  anyFunctionAliasProperty,
  createValidate,
} from '../utils/validateOptions';

type Options = {
  shouldUpdateAirbnbImports?: boolean;
  shouldKeepPropTypes?: boolean;
} & AnyAliasOptions &
  AnyFunctionAliasOptions;

const optionProperties: Properties = {
  ...anyAliasProperty,
  ...anyFunctionAliasProperty,
  shouldUpdateAirbnbImports: { type: 'boolean' },
  shouldKeepPropTypes: { type: 'boolean' },
};

export type PropTypesIdentifierMap = { [property: string]: string };

const reactPropsPlugin: Plugin<Options> = {
  name: 'react-props',

  run({ fileName, sourceFile, options }) {
    if (!fileName.endsWith('.tsx')) return undefined;

    const updates: SourceTextUpdate[] = [];
    const getPropsTypeName = createPropsTypeNameGetter(sourceFile);

    const propTypeIdentifiers: PropTypesIdentifierMap = {};

    for (const node of sourceFile.statements) {
      // Scan for prop type imports and build a map
      // Assumes import statements are higher up in the file than react components
      if (ts.isImportDeclaration(node) && /prop-types/.test(node.moduleSpecifier.getText())) {
        const importBindings = node.importClause?.namedBindings;
        if (importBindings && ts.isNamedImports(importBindings)) {
          importBindings.elements.forEach((specifier) => {
            if (!specifier.propertyName) {
              propTypeIdentifiers[specifier.name.getText()] = specifier.name.getText();
            } else {
              propTypeIdentifiers[specifier.name.getText()] = specifier.propertyName.getText();
            }
          });
        }
      }

      if (isReactNode(node)) {
        const componentName = getComponentName(node);
        const propsTypeName = getPropsTypeName(componentName);
        updates.push(
          ...updatePropTypes(node, propsTypeName, sourceFile, propTypeIdentifiers, options),
        );
      }
    }

    const updatedSourceText = updateSourceText(sourceFile.text, updates);
    const updatedSourceFile = ts.createSourceFile(
      fileName,
      updatedSourceText,
      sourceFile.languageVersion,
    );
    const importUpdates = !options.shouldKeepPropTypes
      ? updateImports(
          updatedSourceFile,
          spreadReplacements.map((cur) => cur.typeImport),
          [
            { moduleSpecifier: 'prop-types' },
            ...(options.shouldUpdateAirbnbImports ? importReplacements : []),
            ...(options.shouldUpdateAirbnbImports
              ? spreadReplacements.map((cur) => cur.spreadImport)
              : []),
          ],
        )
      : [];
    return updateSourceText(updatedSourceText, importUpdates);
  },

  validate: createValidate(optionProperties),
};

export default reactPropsPlugin;

type SpreadReplacement = {
  spreadId: string;
  spreadImport: DefaultImport | NamedImport;
  typeRef: ts.TypeReferenceNode;
  typeImport: DefaultImport | NamedImport;
};

// airbnb related imports
const importReplacements = [{ moduleSpecifier: 'airbnb-prop-types' }];
const spreadReplacements: SpreadReplacement[] = [
  {
    spreadId: 'withStylesPropTypes',
    spreadImport: {
      namedImport: 'withStylesPropTypes',
      moduleSpecifier: ':dls-themes/withStyles',
    },
    typeRef: ts.factory.createTypeReferenceNode('WithStylesProps', undefined),
    typeImport: {
      namedImport: 'WithStylesProps',
      moduleSpecifier: ':dls-themes/withStyles',
    },
  },
  {
    spreadId: 'withBreakpointPropTypes',
    spreadImport: {
      namedImport: 'withBreakpointPropTypes',
      moduleSpecifier: ':dls-core/components/breakpoints/withBreakpoint',
    },
    typeRef: ts.factory.createTypeReferenceNode('WithBreakpointProps', undefined),
    typeImport: {
      namedImport: 'WithBreakpointProps',
      moduleSpecifier: ':dls-core/components/breakpoints/withBreakpoint',
    },
  },
  {
    spreadId: 'withRouterPropTypes',
    spreadImport: {
      defaultImport: 'withRouterPropTypes',
      moduleSpecifier: ':routing/shapes/RR4PropTypes',
    },
    typeRef: ts.factory.createTypeReferenceNode('RouteConfigComponentProps', [
      ts.factory.createTypeLiteralNode([]),
    ]),
    typeImport: {
      namedImport: 'RouteConfigComponentProps',
      moduleSpecifier: 'react-router-config',
    },
  },
];

type ReactNode = ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement;
type ReactSfcNode = ts.FunctionDeclaration | ts.VariableStatement;

function isReactNode(node: ts.Node): node is ReactNode {
  return (
    (ts.isClassDeclaration(node) && isReactClassComponent(node)) ||
    (ts.isFunctionDeclaration(node) && isReactSfcFunctionDeclaration(node)) ||
    (ts.isVariableStatement(node) && isReactSfcArrowFunction(node))
  );
}

function isReactSfcNode(node: ReactNode): node is ReactSfcNode {
  return ts.isFunctionDeclaration(node) || ts.isVariableStatement(node);
}

function updatePropTypes(
  node: ReactNode,
  propsTypeName: string,
  sourceFile: ts.SourceFile,
  propTypeIdentifiers: PropTypesIdentifierMap,
  options: Options,
) {
  const updates: SourceTextUpdate[] = [];
  const printer = ts.createPrinter();

  if (isReactSfcNode(node)) {
    const propsParam = getPropsParam(node);
    const forwardRefComponent = getReactForwardRefFuncExpression(node);

    if (propsParam && !propsParam.type) {
      const propTypesNode = findSfcPropTypesNode(node, sourceFile);
      const objectLiteral = propTypesNode && findPropTypesObjectLiteral(propTypesNode, sourceFile);
      if (objectLiteral) {
        updates.push(
          ...updateObjectLiteral(
            node,
            objectLiteral,
            propsTypeName,
            sourceFile,
            propTypeIdentifiers,
            options,
            false,
          ),
        );
        if (forwardRefComponent) {
          updates.push({
            kind: 'replace',
            index: forwardRefComponent.expression.pos,
            length: forwardRefComponent.expression.end - forwardRefComponent.expression.pos,
            text: ` ${printer.printNode(
              ts.EmitHint.Unspecified,
              ts.factory.updateExpressionWithTypeArguments(
                forwardRefComponent as any,
                forwardRefComponent.expression,
                [
                  ts.factory.createTypeReferenceNode(options.anyAlias || 'any', undefined),
                  ts.factory.createTypeReferenceNode(propsTypeName, undefined),
                ].filter(isNotNull) as any,
              ),
              sourceFile,
            )}`,
          });
        } else {
          let updateText = printer.printNode(
            ts.EmitHint.Unspecified,
            ts.factory.updateParameterDeclaration(
              propsParam,
              propsParam.decorators,
              propsParam.modifiers,
              propsParam.dotDotDotToken,
              propsParam.name,
              propsParam.questionToken,
              ts.factory.createTypeReferenceNode(propsTypeName, undefined),
              propsParam.initializer,
            ),
            sourceFile,
          );

          const signature = propsParam.parent;
          if (
            ts.isArrowFunction(signature) &&
            signature.parameters.length === 1 &&
            signature.getFirstToken()?.kind !== ts.SyntaxKind.OpenParenToken
          ) {
            // Special case: when an arrow function has a single parameter and no parentheses,
            // add parentheses.
            updateText = `(${updateText})`;
          }

          updates.push({
            kind: 'replace',
            index: propsParam.pos,
            length: propsParam.end - propsParam.pos,
            text: updateText,
          });
        }

        if (!options.shouldKeepPropTypes) {
          updates.push(...deleteSfcPropTypes(node, sourceFile));
        }
      }
    }
  } else {
    const heritageType = getReactComponentHeritageType(node)!;
    const heritageTypeArgs = heritageType.typeArguments || [];
    const propsType = heritageTypeArgs[0];
    const stateType = heritageTypeArgs[1];
    if (!propsType || isEmptyTypeLiteral(propsType)) {
      const propTypesNode = findClassPropTypesNode(node, sourceFile);
      const objectLiteral = propTypesNode && findPropTypesObjectLiteral(propTypesNode, sourceFile);
      if (objectLiteral) {
        updates.push(
          ...updateObjectLiteral(node, objectLiteral, propsTypeName, sourceFile, {}, options, true),
        );

        updates.push({
          kind: 'replace',
          index: heritageType.pos,
          length: heritageType.end - heritageType.pos,
          text: ` ${printer.printNode(
            ts.EmitHint.Unspecified,
            ts.factory.updateExpressionWithTypeArguments(
              heritageType,
              heritageType.expression,
              [ts.factory.createTypeReferenceNode(propsTypeName, undefined), stateType].filter(
                isNotNull,
              ) as any,
            ),
            sourceFile,
          )}`,
        });

        if (!options.shouldKeepPropTypes) {
          updates.push(...deleteClassPropTypes(node, sourceFile));
        }
      }
    }
  }

  return updates;
}

function isEmptyTypeLiteral(node: ts.Node) {
  return ts.isTypeLiteralNode(node) && node.members.length === 0;
}

function updateObjectLiteral(
  node: ReactNode,
  objectLiteral: ts.ObjectLiteralExpression,
  propsTypeName: string,
  sourceFile: ts.SourceFile,
  propTypeIdentifiers: PropTypesIdentifierMap,
  options: Options,
  implicitChildren: boolean,
) {
  const updates: SourceTextUpdate[] = [];
  const printer = ts.createPrinter();

  const propsTypeNode = getTypeFromPropTypesObjectLiteral(objectLiteral, sourceFile, {
    anyAlias: options.anyAlias,
    anyFunctionAlias: options.anyFunctionAlias,
    implicitChildren,
    spreadReplacements,
    propTypeIdentifiers,
  });
  let propsTypeAlias = ts.factory.createTypeAliasDeclaration(
    undefined,
    undefined,
    propsTypeName,
    undefined,
    propsTypeNode,
  );
  propsTypeAlias = ts.moveSyntheticComments(propsTypeAlias, propsTypeNode);

  const varStatement = getParentVariableStatement(objectLiteral, sourceFile);
  if (varStatement && !options.shouldKeepPropTypes) {
    updates.push({
      kind: 'replace',
      index: varStatement.pos,
      length: varStatement.end - varStatement.pos,
      text: getTextPreservingWhitespace(varStatement, propsTypeAlias, sourceFile),
    });
  } else {
    updates.push({
      kind: 'insert',
      index: node.pos,
      text: `\n\n${printer.printNode(ts.EmitHint.Unspecified, propsTypeAlias, sourceFile)}`,
    });
  }

  return updates;
}

function getComponentName(node: ReactNode) {
  if (ts.isClassDeclaration(node) || ts.isFunctionDeclaration(node)) {
    return node.name && node.name.text;
  }

  if (ts.isVariableStatement(node)) {
    const declaration = node.declarationList.declarations[0];
    return declaration && declaration.name && ts.isIdentifier(declaration.name)
      ? declaration.name.text
      : undefined;
  }

  return undefined;
}

function getPropsParam(node: ReactSfcNode) {
  if (ts.isFunctionDeclaration(node)) {
    return node.parameters[0];
  }

  if (ts.isVariableStatement(node)) {
    const forwardRefComponent = getReactForwardRefFuncExpression(node);
    const forwardRefArgument =
      forwardRefComponent && forwardRefComponent.arguments && forwardRefComponent.arguments[0];
    const forwardRefProps =
      forwardRefArgument &&
      ts.isFunctionLike(forwardRefArgument) &&
      forwardRefArgument.parameters[0];
    const declaration = node.declarationList.declarations[0];
    const init = declaration && declaration.initializer;
    const arrowFunction = init && ts.isArrowFunction(init) ? init : undefined;
    const arrowFunctionProps = arrowFunction && arrowFunction.parameters[0];
    return forwardRefProps || arrowFunctionProps;
  }

  return undefined;
}

function getReactForwardRefFuncExpression(node: ReactNode) {
  return (
    !!ts.isVariableStatement(node) &&
    !!node.declarationList?.declarations[0]?.initializer &&
    ts.isCallExpression(node.declarationList?.declarations[0]?.initializer) &&
    isReactForwardRefName(node.declarationList?.declarations[0]?.initializer) &&
    node.declarationList?.declarations[0]?.initializer
  );
}

function getParentVariableStatement(
  objectLiteral: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile,
): ts.VariableStatement | undefined {
  let cur: ts.Node = objectLiteral;
  while (cur !== sourceFile) {
    if (ts.isVariableStatement(cur)) {
      return cur;
    }
    cur = cur.parent;
  }

  return undefined;
}

function deleteClassPropTypes(classDeclaration: ts.ClassDeclaration, sourceFile: ts.SourceFile) {
  const updates: SourceTextUpdate[] = [];

  for (const member of classDeclaration.members) {
    if (isPropTypesStatic(member)) {
      updates.push({
        kind: 'delete',
        index: member.pos,
        length: member.end - member.pos,
      });

      if (member.initializer && ts.isIdentifier(member.initializer)) {
        updates.push(...deleteIdRef(member.initializer, sourceFile));
      }
    }
  }

  const className = classDeclaration.name && classDeclaration.name.text;
  if (className) {
    updates.push(...deletePropTypesStatements(className, sourceFile));
  }

  return updates;
}

function deleteSfcPropTypes(node: ReactSfcNode, sourceFile: ts.SourceFile) {
  const componentName = getComponentName(node);
  return componentName ? deletePropTypesStatements(componentName, sourceFile) : [];
}

function deletePropTypesStatements(componentName: string, sourceFile: ts.SourceFile) {
  const updates: SourceTextUpdate[] = [];

  for (const statement of sourceFile.statements) {
    if (isPropTypesStatement(statement, componentName)) {
      updates.push({
        kind: 'delete',
        index: statement.pos,
        length: statement.end - statement.pos,
      });

      if (
        ts.isBinaryExpression(statement.expression) &&
        ts.isIdentifier(statement.expression.right)
      ) {
        updates.push(...deleteIdRef(statement.expression.right, sourceFile));
      }
    }
  }

  return updates;
}

function deleteIdRef(idenifier: ts.Identifier, sourceFile: ts.SourceFile) {
  const updates: SourceTextUpdate[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isVariableDeclarationList(statement) && statement.declarations.length === 1) {
      const declaration = statement.declarations[0];
      if (
        ts.isVariableDeclaration(declaration) &&
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === idenifier.text
      ) {
        if (declaration.initializer && ts.isIdentifier(declaration.initializer)) {
          updates.push(
            {
              kind: 'delete',
              index: declaration.pos,
              length: declaration.end - declaration.pos,
            },
            ...deleteIdRef(declaration.initializer, sourceFile),
          );
        }
      }
    }
  }

  return updates;
}

function isPropTypesStatic(member: ts.ClassElement): member is ts.PropertyDeclaration {
  return (
    ts.isPropertyDeclaration(member) &&
    member.modifiers != null &&
    member.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword) &&
    ts.isIdentifier(member.name) &&
    member.name.text === 'propTypes' &&
    member.initializer != null
  );
}

function isPropTypesStatement(
  statement: ts.Statement,
  componentName: string,
): statement is ts.ExpressionStatement {
  return (
    ts.isExpressionStatement(statement) &&
    ts.isBinaryExpression(statement.expression) &&
    ts.isPropertyAccessExpression(statement.expression.left) &&
    ts.isIdentifier(statement.expression.left.expression) &&
    statement.expression.left.expression.text === componentName &&
    ts.isIdentifier(statement.expression.left.name) &&
    statement.expression.left.name.text === 'propTypes'
  );
}

function findClassPropTypesNode(
  classDeclaration: ts.ClassDeclaration,
  sourceFile: ts.SourceFile,
): ts.PropertyDeclaration | ts.ExpressionStatement | undefined {
  for (const member of classDeclaration.members) {
    if (isPropTypesStatic(member)) {
      return member;
    }
  }

  const componentName = classDeclaration.name && classDeclaration.name.text;
  for (const statement of sourceFile.statements) {
    if (componentName && isPropTypesStatement(statement, componentName)) {
      return statement;
    }
  }

  return undefined;
}

function findSfcPropTypesNode(
  node: ReactSfcNode,
  sourceFile: ts.SourceFile,
): ts.PropertyDeclaration | ts.ExpressionStatement | undefined {
  const componentName = getComponentName(node);
  for (const statement of sourceFile.statements) {
    if (componentName && isPropTypesStatement(statement, componentName)) {
      return statement;
    }
  }

  return undefined;
}

function findPropTypesObjectLiteral(
  node: ts.PropertyDeclaration | ts.ExpressionStatement | undefined,
  sourceFile: ts.SourceFile,
): ts.ObjectLiteralExpression | undefined {
  if (!node) return undefined;

  let expression: ts.Expression | undefined;
  if (ts.isPropertyDeclaration(node) && node.initializer != null) {
    expression = node.initializer;
  } else if (ts.isExpressionStatement(node) && ts.isBinaryExpression(node.expression)) {
    expression = node.expression.right;
  }

  return unpackInitializer(expression, sourceFile);
}

function unpackInitializer(
  initializer: ts.Expression | undefined,
  sourceFile: ts.SourceFile,
): ts.ObjectLiteralExpression | undefined {
  if (!initializer) {
    return undefined;
  }

  if (ts.isObjectLiteralExpression(initializer)) {
    return initializer;
  }

  if (
    ts.isCallExpression(initializer) &&
    ts.isIdentifier(initializer.expression) &&
    initializer.expression.text === 'forbidExtraProps' &&
    initializer.arguments.length === 1
  ) {
    const arg = initializer.arguments[0];
    if (ts.isObjectLiteralExpression(arg)) {
      return arg;
    }
  }

  if (ts.isIdentifier(initializer)) {
    for (const statement of sourceFile.statements) {
      if (
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.length === 1
      ) {
        const declaration = statement.declarationList.declarations[0];
        if (
          ts.isVariableDeclaration(declaration) &&
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === initializer.text
        ) {
          return unpackInitializer(declaration.initializer, sourceFile);
        }
      }
    }
  }

  return undefined;
}
