/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import updateSourceText, { SourceTextUpdate } from '../utils/updateSourceText';
import {
  findKnownImports,
  findKnownVariables,
  collectIdentifierNodes,
  KnownDefinitionMap,
} from './utils/identifiers';
import { AnyAliasOptions, validateAnyAliasOptions } from '../utils/validateOptions';

type Options = AnyAliasOptions;

const hoistClassStaticsPlugin: Plugin<Options> = {
  name: 'hoist-class-statics',

  run({ sourceFile, text, options }) {
    return hoistStaticClassProperties(sourceFile, text, options);
  },

  validate: validateAnyAliasOptions,
};

export default hoistClassStaticsPlugin;

/**
 * Determines whether or not we can hoist this identifier
 * @param identifier
 * @param hoistToPos -- the position we would hoist this identifier to
 * @param knownDefinitions -- a map describing any known imports or variable declarations
 */
function canHoistIdentifier(
  identifier: ts.Identifier,
  hoistToPos: number,
  knownDefinitions: KnownDefinitionMap,
): boolean {
  const globalWhitelist = ['Number', 'String', 'Object', 'Date', 'window', 'global'];
  const id = identifier.text;
  const isDefined = knownDefinitions[id] && knownDefinitions[id].end <= hoistToPos;
  const isGlobal = globalWhitelist.includes(id);

  return (
    isDefined ||
    isGlobal ||
    // e.g. in 'PropTypes.string.isRequired' allow the accessing identifiers 'string' and 'isRequired'
    (ts.isPropertyAccessExpression(identifier.parent) && identifier.parent.name === identifier) ||
    // e.g. in { foo: 'bar' } allow the assigned identifier key 'foo'
    (ts.isPropertyAssignment(identifier.parent) && identifier.parent.name === identifier) ||
    // e.g. in { foo() {} } allow foo
    (ts.isMethodDeclaration(identifier.parent) && identifier.parent.name === identifier)
  );
}

/**
 * Determines whether or not we can hoist this expression
 * @param expression
 * @param hoistToPos -- the position we would hoist this expression to
 * @param knownDefinitions -- a map describing any known imports or variable declarations
 */
function canHoistExpression(
  expression: ts.Expression,
  hoistToPos: number,
  knownDefinitions: KnownDefinitionMap,
): boolean {
  const allIdentifiers = collectIdentifierNodes(expression);
  return allIdentifiers.every((identifier: ts.Identifier) =>
    canHoistIdentifier(identifier, hoistToPos, knownDefinitions),
  );
}

/**
 * Determines whether or not this assignment was already hoisted to this class
 * @param statment -- a static binary expresison statement
 * @param classDeclaration -- the class declaration to hoist to
 */
function isAlreadyHoisted(
  statement: ts.ExpressionStatement,
  classDeclaration: ts.ClassDeclaration,
): boolean {
  if (
    !ts.isBinaryExpression(statement.expression) ||
    !ts.isPropertyAccessExpression(statement.expression.left)
  ) {
    return false;
  }

  const propertyToHoist = statement.expression.left.name.text;
  return classDeclaration.members.some(
    (member) => member.name && ts.isIdentifier(member.name) && member.name.text === propertyToHoist,
  );
}

function hoistStaticClassProperties(
  sourceFile: ts.SourceFile,
  sourceText: string,
  options: Options,
): string {
  const printer = ts.createPrinter();
  const updates: SourceTextUpdate[] = [];

  const classDeclarations = sourceFile.statements.filter(ts.isClassDeclaration);
  const knownDefinitions = {
    ...findKnownImports(sourceFile),
    ...findKnownVariables(sourceFile),
  };

  classDeclarations.forEach((classDeclaration) => {
    const className = classDeclaration.name;
    if (!className) return;

    const properties: ts.PropertyDeclaration[] = [];

    sourceFile.statements.forEach((statement) => {
      if (
        ts.isExpressionStatement(statement) &&
        ts.isBinaryExpression(statement.expression) &&
        ts.isPropertyAccessExpression(statement.expression.left) &&
        ts.isIdentifier(statement.expression.left.expression) &&
        statement.expression.left.expression.text === className.text &&
        statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ) {
        if (isAlreadyHoisted(statement, classDeclaration)) {
          return;
        }
        if (
          canHoistExpression(statement.expression.right, classDeclaration.pos, knownDefinitions)
        ) {
          properties.push(
            ts.factory.createPropertyDeclaration(
              undefined,
              [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
              statement.expression.left.name.text,
              undefined,
              undefined,
              statement.expression.right,
            ),
          );
          updates.push({
            kind: 'delete',
            index: statement.pos,
            length: statement.end - statement.pos,
          });
        } else {
          // otherwise add a static type annotation for this expression
          properties.push(
            ts.factory.createPropertyDeclaration(
              undefined,
              [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)],
              statement.expression.left.name.text,
              undefined,
              options.anyAlias != null
                ? ts.factory.createTypeReferenceNode(options.anyAlias, undefined)
                : ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
              undefined,
            ),
          );
        }
      }
    });

    if (properties.length > 0) {
      if (classDeclaration.members.length === 0) {
        const updatedClassDeclaration = ts.factory.updateClassDeclaration(
          classDeclaration,
          classDeclaration.decorators,
          classDeclaration.modifiers,
          classDeclaration.name,
          classDeclaration.typeParameters,
          classDeclaration.heritageClauses,
          ts.factory.createNodeArray(properties),
        );

        let index = classDeclaration.pos;
        while (index < sourceText.length && /\s/.test(sourceText[index])) index += 1;
        const length = classDeclaration.end - index;

        const text = printer.printNode(
          ts.EmitHint.Unspecified,
          updatedClassDeclaration,
          sourceFile,
        );

        updates.push({ kind: 'replace', index, length, text });
      } else {
        const text =
          ts.sys.newLine +
          properties
            .map((property) => printer.printNode(ts.EmitHint.Unspecified, property, sourceFile))
            .join(ts.sys.newLine + ts.sys.newLine) +
          ts.sys.newLine;

        updates.push({ kind: 'insert', index: classDeclaration.members[0].pos, text });
      }
    }
  });

  return updateSourceText(sourceText, updates);
}
