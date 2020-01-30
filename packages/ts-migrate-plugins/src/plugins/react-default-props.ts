import ts from 'typescript';
import { Plugin } from '../../types';
import updateSourceText, { SourceTextUpdate } from '../utils/updateSourceText';

type Options = {
  skipUsingDefaultPropsHelper?: boolean;
};

/**
 * At first, we are going to check is there any
 *  - `CompName.defaultProps = defaultPropsName;`
 *  - `static defaultProps = defaultPropsName`
 *  in the file
 */
const WITH_DEFAULT_PROPS_HELPER = `WithDefaultProps`;

const reactDefaultPropsPlugin: Plugin<Options> = {
  name: 'react-default-props',
  run({ sourceFile, text, options }) {
    const importDeclarations = sourceFile.statements.filter(ts.isImportDeclaration);
    const expressionStatements = sourceFile.statements.filter(ts.isExpressionStatement);
    const classDeclarations = sourceFile.statements.filter(ts.isClassDeclaration);
    // sfcs default props assignments
    const sfcsDefaultPropsAssignments = expressionStatements.filter(
      (expressionStatement) =>
        ts.isBinaryExpression(expressionStatement.expression) &&
        ts.isPropertyAccessExpression(expressionStatement.expression.left) &&
        expressionStatement.expression.left.name.getText() === 'defaultProps',
    );

    // class default props assigments
    const classDefaultPropsAssignment = classDeclarations.filter(
      (classDeclaration) =>
        classDeclaration.members
          .filter(ts.isPropertyDeclaration)
          .filter((declaration) => declaration.name.getText() === 'defaultProps').length > 0,
    );

    if (sfcsDefaultPropsAssignments.length === 0 && classDefaultPropsAssignment.length === 0) {
      return undefined;
    }

    const functionDeclarations = sourceFile.statements.filter(ts.isFunctionDeclaration);
    const variableStatements = sourceFile.statements.filter(ts.isVariableStatement);
    // will use Props type from here
    const typeAliasDeclarations = sourceFile.statements.filter(ts.isTypeAliasDeclaration);

    const updates: SourceTextUpdate[] = [];
    const printer = ts.createPrinter();
    const processedPropTypes = new Map<string, string>();

    let shouldAddWithDefaultPropsImport = !importDeclarations.some((importDeclaration) =>
      /WithDefaultProps/.test(importDeclaration.moduleSpecifier.getText()),
    );

    const insertWithDefaultPropsImport = () => {
      if (shouldAddWithDefaultPropsImport) {
        updates.push({
          kind: 'insert',
          index: 0,
          text: `${printer.printNode(
            ts.EmitHint.Unspecified,
            getWithDefaultPropsImport(),
            sourceFile,
          )}\n`,
        });
        // it probably could be done in the better way :)
        shouldAddWithDefaultPropsImport = false;
      }
    };

    const modifyAndInsertPropsType = (
      propsTypeAliasDeclaration: ts.TypeAliasDeclaration,
      defaultPropsTypeName: string,
      propsTypeName: string,
      newTypeInsertPos: number,
      componentTypeReference: ts.TypeReferenceNode,
    ) => {
      // we don't want process props types more than once
      if (processedPropTypes.get(propsTypeName) === defaultPropsTypeName) return;

      // prevent multiple usage of defalut props or WithDefaultProps
      const alreadyHaveDefalutProps = ts.isIntersectionTypeNode(propsTypeAliasDeclaration.type)
        ? propsTypeAliasDeclaration.type.types.some(
            (typeExp) =>
              (ts.isTypeQueryNode(typeExp) &&
                typeExp.exprName.getText() === defaultPropsTypeName) ||
              typeExp.getText().includes(WITH_DEFAULT_PROPS_HELPER),
          )
        : ts.isTypeReferenceNode(propsTypeAliasDeclaration.type) &&
          propsTypeAliasDeclaration.type.typeName.getText() === WITH_DEFAULT_PROPS_HELPER;

      if (alreadyHaveDefalutProps) return;

      if (!options.skipUsingDefaultPropsHelper) insertWithDefaultPropsImport();

      const indexOfTypeValue = ts.isIntersectionTypeNode(propsTypeAliasDeclaration.type)
        ? propsTypeAliasDeclaration.type.types.findIndex((typeEl) => ts.isTypeLiteralNode(typeEl))
        : -1;

      const propTypesAreOnlyReferences =
        ts.isIntersectionTypeNode(propsTypeAliasDeclaration.type) && indexOfTypeValue === -1;

      const propsTypeValueNode = ts.isIntersectionTypeNode(propsTypeAliasDeclaration.type)
        ? ts.updateIntersectionTypeNode(
            propsTypeAliasDeclaration.type,
            ts.createNodeArray(
              propsTypeAliasDeclaration.type.types.filter(
                (_, k) => propTypesAreOnlyReferences || indexOfTypeValue === k,
              ),
            ),
          )
        : propsTypeAliasDeclaration.type;

      const doesPropsTypeHaveExport =
        propsTypeAliasDeclaration.modifiers &&
        propsTypeAliasDeclaration.modifiers.find(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        );

      // rename type PropName -> type OwnPropName
      const updatedPropTypesName = doesPropsTypeHaveExport ? propsTypeName : `Own${propsTypeName}`;
      const updatedPropTypeAlias = ts.updateTypeAliasDeclaration(
        propsTypeAliasDeclaration,
        propsTypeAliasDeclaration.decorators,
        propsTypeAliasDeclaration.modifiers,
        ts.createIdentifier(updatedPropTypesName),
        propsTypeAliasDeclaration.typeParameters,
        propsTypeValueNode,
      );

      const index = propsTypeAliasDeclaration.pos;
      const length = propsTypeAliasDeclaration.end - index;
      const text = printer.printNode(ts.EmitHint.Unspecified, updatedPropTypeAlias, sourceFile);
      updates.push({ kind: 'replace', index, length, text: `\n\n${text}` });

      // create type Props = WithDefaultProps<OwnProps, typeof defaultProps> & types;
      const newPropsTypeValue = options.skipUsingDefaultPropsHelper
        ? ts.createIntersectionTypeNode([
            ts.createTypeReferenceNode(updatedPropTypesName, undefined),
            ts.createTypeQueryNode(ts.createIdentifier(defaultPropsTypeName)),
          ])
        : ts.createTypeReferenceNode(WITH_DEFAULT_PROPS_HELPER, [
            ts.createTypeReferenceNode(updatedPropTypesName, undefined),
            ts.createTypeQueryNode(ts.createIdentifier(defaultPropsTypeName)),
          ]);

      const componentPropsTypeName = doesPropsTypeHaveExport
        ? `Private${propsTypeName}`
        : propsTypeName;

      const newPropsTypeAlias = ts.createTypeAliasDeclaration(
        undefined,
        undefined,
        ts.createIdentifier(componentPropsTypeName),
        undefined,
        ts.isIntersectionTypeNode(propsTypeAliasDeclaration.type)
          ? ts.createIntersectionTypeNode([
              newPropsTypeValue,
              ...propsTypeAliasDeclaration.type.types.filter((el, k) =>
                propTypesAreOnlyReferences
                  ? ts.isIntersectionTypeNode(updatedPropTypeAlias) &&
                    !updatedPropTypeAlias.types.includes(el)
                  : indexOfTypeValue !== k,
              ),
            ])
          : newPropsTypeValue,
      );

      updates.push({
        kind: 'insert',
        index: newTypeInsertPos,
        text: `\n\n${printer.printNode(ts.EmitHint.Unspecified, newPropsTypeAlias, sourceFile)}`,
      });

      // we should rename component prop type in that case
      if (doesPropsTypeHaveExport) {
        const updatedComponentTypeReference = ts.updateTypeReferenceNode(
          componentTypeReference,
          ts.createIdentifier(componentPropsTypeName),
          undefined,
        );

        const index = componentTypeReference.pos;
        const length = componentTypeReference.end - index;
        const text = printer.printNode(
          ts.EmitHint.Unspecified,
          updatedComponentTypeReference,
          sourceFile,
        );
        updates.push({ kind: 'replace', index, length, text: `${text}` });
      }

      processedPropTypes.set(propsTypeName, defaultPropsTypeName);
    };

    /* process all default props assignments:
     * - find out, is it object literal expression or identifier obj reference
     * - if it's obj literal - use `CompName.defaultProps`, otherwise - save variable name
     * - create OwnProp type
     * - create/modify type Props = WithDefaultProps
     * - use a new Props type in the component
     */
    sfcsDefaultPropsAssignments.forEach((defaultProp) => {
      const expression = defaultProp.expression as ts.BinaryExpression;
      const leftPart = expression.left as ts.PropertyAccessExpression;
      const componentName = leftPart.expression.getText();

      const isObjectIdentifier = ts.isIdentifier(expression.right);
      const defaultPropsTypeName = isObjectIdentifier
        ? expression.right.getText()
        : `${componentName}.defaultProps`;

      const variableDeclaration = variableStatements.find(
        (variableStatement) =>
          !!variableStatement.declarationList.declarations.find(
            (declaration) => !!(declaration.name && declaration.name.getText() === componentName),
          ),
      );

      const variableInitializer = variableDeclaration
        ? variableDeclaration.declarationList.declarations[0].initializer
        : undefined;

      const componentDeclaration =
        functionDeclarations.find(
          (functionDeclaration) =>
            !!(functionDeclaration.name && functionDeclaration.name.getText() === componentName),
        ) ||
        (variableInitializer &&
        (ts.isArrowFunction(variableInitializer) || ts.isFunctionDeclaration(variableInitializer))
          ? variableInitializer
          : undefined);

      // hasPropsTypeReference
      if (
        componentDeclaration &&
        componentDeclaration.parameters.length === 1 &&
        componentDeclaration.parameters[0].type !== undefined &&
        ts.isTypeReferenceNode(componentDeclaration.parameters[0].type)
      ) {
        const propsTypeName = componentDeclaration.parameters[0].type.getText();
        const propsTypeAliasDeclarations = typeAliasDeclarations.find(
          (typeAlias) => typeAlias.name.getText() === propsTypeName,
        );

        if (propsTypeAliasDeclarations) {
          const newTypeInsertPos =
            variableDeclaration && variableInitializer
              ? variableDeclaration.pos
              : componentDeclaration.pos;

          modifyAndInsertPropsType(
            propsTypeAliasDeclarations,
            defaultPropsTypeName,
            propsTypeName,
            newTypeInsertPos,
            componentDeclaration.parameters[0].type,
          );
        }
      }
    });

    classDefaultPropsAssignment.forEach((classDeclaration) => {
      const componentName = classDeclaration.name && classDeclaration.name.getText();

      const defaultPropsDeclaration = classDeclaration.members
        .filter(ts.isPropertyDeclaration)
        .filter((declaration) => declaration.name.getText() === 'defaultProps')[0];

      if (!defaultPropsDeclaration) return;

      const isObjectIdentifier =
        defaultPropsDeclaration.initializer && ts.isIdentifier(defaultPropsDeclaration.initializer);
      const defaultPropsTypeName =
        isObjectIdentifier && defaultPropsDeclaration.initializer
          ? defaultPropsDeclaration.initializer.getText()
          : `${componentName}.defaultProps`;
      const variableDeclaration = variableStatements.find(
        (variableStatement) =>
          !!variableStatement.declarationList.declarations.find(
            (declaration) => !!(declaration.name && declaration.name.getText() === componentName),
          ),
      );
      const variableInitializer = variableDeclaration
        ? variableDeclaration.declarationList.declarations[0].initializer
        : undefined;
      const heritageClause = classDeclaration.heritageClauses
        ? classDeclaration.heritageClauses.find((heritageClause) => heritageClause.types.length > 0)
        : undefined;
      const expressionWithTypeArguments =
        heritageClause && heritageClause.types
          ? heritageClause.types.find(
              (x) =>
                ts.isExpressionWithTypeArguments(x) &&
                (x.typeArguments ? x.typeArguments.length > 0 : false),
            )
          : undefined;
      const propsTypeReferenceNode =
        expressionWithTypeArguments && expressionWithTypeArguments.typeArguments
          ? (expressionWithTypeArguments.typeArguments.find((genericArgs) =>
              ts.isTypeReferenceNode(genericArgs),
            ) as ts.TypeReferenceNode | undefined)
          : undefined;

      // wasn't able to find a typename of the props :(
      if (!propsTypeReferenceNode || !componentName) return;

      const propsTypeName = propsTypeReferenceNode.getText();
      const propsTypeAliasDeclarations = typeAliasDeclarations.find(
        (typeAlias) => typeAlias.name.getText() === propsTypeName,
      );

      if (propsTypeAliasDeclarations) {
        const newTypeInsertPos =
          variableDeclaration && variableInitializer
            ? variableDeclaration.pos
            : classDeclaration.pos;
        modifyAndInsertPropsType(
          propsTypeAliasDeclarations,
          defaultPropsTypeName,
          propsTypeName,
          newTypeInsertPos,
          propsTypeReferenceNode,
        );
      }
    });

    return updateSourceText(text, updates);
  },
};

// the target project might not have this as an internal dependency in project.json
// It would have to be manually added, otherwise CI will complain about it
function getWithDefaultPropsImport() {
  return ts.createImportDeclaration(
    undefined,
    undefined,
    ts.createImportClause(
      undefined,
      ts.createNamedImports([
        ts.createImportSpecifier(undefined, ts.createIdentifier('WithDefaultProps')),
      ]),
    ),
    ts.createStringLiteral(':ts-utils/types/WithDefaultProps'),
  );
}

export default reactDefaultPropsPlugin;
