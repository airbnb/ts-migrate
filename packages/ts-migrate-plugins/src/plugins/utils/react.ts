/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';

function isReactClassComponentName(name: string): boolean {
  return name === 'Component' || name === 'PureComponent';
}

export function isReactClassComponent(classDeclaration: ts.ClassDeclaration): boolean {
  const heritageType = getReactComponentHeritageType(classDeclaration);

  if (heritageType) {
    if (
      ts.isPropertyAccessExpression(heritageType.expression) &&
      ts.isIdentifier(heritageType.expression.expression) &&
      heritageType.expression.expression.text === 'React' &&
      isReactClassComponentName(heritageType.expression.name.text)
    ) {
      return true;
    }

    if (
      ts.isIdentifier(heritageType.expression) &&
      isReactClassComponentName(heritageType.expression.text)
    ) {
      return true;
    }
  }

  return false;
}

export function isReactSfcFunctionDeclaration(
  functionDeclaration: ts.FunctionDeclaration,
): boolean {
  return (
    functionDeclaration.name != null &&
    /^[A-Z]\w*$/.test(functionDeclaration.name.text) &&
    functionDeclaration.parameters.length <= 2
  );
}

export function isReactSfcArrowFunction(variableStatement: ts.VariableStatement): boolean {
  return variableStatement.declarationList.declarations.length === 1 &&
    ts.isIdentifier(variableStatement.declarationList.declarations[0].name) &&
    /^[A-Z]\w*$/.test(variableStatement.declarationList.declarations[0].name.text) &&
    variableStatement.declarationList.declarations[0].initializer != null &&
    ts.isCallExpression(variableStatement.declarationList.declarations[0].initializer) &&
    isReactForwardRefName(variableStatement.declarationList.declarations[0].initializer)
    ? true
    : variableStatement.declarationList.declarations[0].initializer != null &&
        ts.isArrowFunction(variableStatement.declarationList.declarations[0].initializer) &&
        variableStatement.declarationList.declarations[0].initializer.parameters.length <= 2;
}

export function isReactForwardRefName(initializer: ts.CallExpression) {
  const { expression } = initializer;

  if (ts.isIdentifier(expression)) {
    return /forwardRef/gi.test(expression.escapedText.toString());
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return /forwardRef/gi.test(expression.name?.escapedText.toString());
  }

  return false;
}

export function getReactComponentHeritageType(
  classDeclaration: ts.ClassDeclaration,
): ts.ExpressionWithTypeArguments | undefined {
  if (
    classDeclaration.heritageClauses &&
    classDeclaration.heritageClauses.length === 1 &&
    classDeclaration.heritageClauses[0].types.length === 1 &&
    ts.isExpressionWithTypeArguments(classDeclaration.heritageClauses[0].types[0])
  ) {
    return classDeclaration.heritageClauses[0].types[0];
  }

  return undefined;
}

export function getNumComponentsInSourceFile(sourceFile: ts.SourceFile): number {
  const reactClassDeclarations = sourceFile.statements
    .filter(ts.isClassDeclaration)
    .filter(isReactClassComponent);

  const reactSfcFunctionDeclarations = sourceFile.statements
    .filter(ts.isFunctionDeclaration)
    .filter(isReactSfcFunctionDeclaration);

  const reactSfcArrowFunctions = sourceFile.statements
    .filter(ts.isVariableStatement)
    .filter(isReactSfcArrowFunction);

  return (
    reactClassDeclarations.length +
    reactSfcFunctionDeclarations.length +
    reactSfcArrowFunctions.length
  );
}
