import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import {
  isReactClassComponent,
  getReactComponentHeritageType,
  getNumComponentsInSourceFile,
} from './utils/react';
import { collectIdentifiers } from './utils/identifiers';
import updateSourceText, { SourceTextUpdate } from '../utils/updateSourceText';
import { AnyAliasOptions, validateAnyAliasOptions } from '../utils/validateOptions';

type Options = AnyAliasOptions;

const reactClassStatePlugin: Plugin<Options> = {
  name: 'react-class-state',

  async run({ fileName, sourceFile, options }) {
    if (!fileName.endsWith('.tsx')) return undefined;

    const updates: SourceTextUpdate[] = [];
    const printer = ts.createPrinter();

    const reactClassDeclarations = sourceFile.statements
      .filter(ts.isClassDeclaration)
      .filter(isReactClassComponent);
    if (reactClassDeclarations.length === 0) return undefined;

    const numComponentsInFile = getNumComponentsInSourceFile(sourceFile);
    const usedIdentifiers = collectIdentifiers(sourceFile);

    reactClassDeclarations.forEach((classDeclaration) => {
      const componentName = (classDeclaration.name && classDeclaration.name.text) || 'Component';
      const heritageType = getReactComponentHeritageType(classDeclaration)!;
      const heritageTypeArgs = heritageType.typeArguments || [];
      const propsType = heritageTypeArgs[0];
      const stateType = heritageTypeArgs[1];

      const getStateTypeName = () => {
        let name = '';
        if (propsType && ts.isTypeReferenceNode(propsType) && ts.isIdentifier(propsType.typeName)) {
          name = propsType.typeName.text.replace('Props', 'State');
        } else if (numComponentsInFile > 1) {
          name = `${componentName}State`;
        } else {
          name = 'State';
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

      if (!stateType && usesState(classDeclaration)) {
        const stateTypeName = getStateTypeName();
        const anyType =
          options.anyAlias != null
            ? ts.factory.createTypeReferenceNode(options.anyAlias, undefined)
            : ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        const newStateType = ts.factory.createTypeAliasDeclaration(
          undefined,
          undefined,
          stateTypeName,
          undefined,
          anyType,
        );

        updates.push({
          kind: 'insert',
          index: classDeclaration.pos,
          text: `\n\n${printer.printNode(ts.EmitHint.Unspecified, newStateType, sourceFile)}`,
        });

        updates.push({
          kind: 'replace',
          index: heritageType.pos,
          length: heritageType.end - heritageType.pos,
          text: ` ${printer.printNode(
            ts.EmitHint.Unspecified,
            ts.factory.updateExpressionWithTypeArguments(heritageType, heritageType.expression, [
              propsType || ts.factory.createTypeLiteralNode([]),
              ts.factory.createTypeReferenceNode(stateTypeName, undefined),
            ]),
            sourceFile,
          )}`,
        });
      }
    });

    return updateSourceText(sourceFile.text, updates);
  },

  validate: validateAnyAliasOptions,
};

export default reactClassStatePlugin;

function usesState(classDeclaration: ts.ClassDeclaration): boolean {
  const visitor = (node: ts.Node): boolean | undefined => {
    if (
      ts.isPropertyAccessExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ThisKeyword &&
      node.name.text === 'state'
    ) {
      return true;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
      node.expression.name.text === 'setState'
    ) {
      return true;
    }

    return ts.forEachChild(node, visitor);
  };

  return !!ts.forEachChild(classDeclaration, visitor);
}
