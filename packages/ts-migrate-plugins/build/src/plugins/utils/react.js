/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';
function isReactClassComponentName(name) {
    return name === 'Component' || name === 'PureComponent';
}
export function isReactClassComponent(classDeclaration) {
    const heritageType = getReactComponentHeritageType(classDeclaration);
    if (heritageType) {
        if (ts.isPropertyAccessExpression(heritageType.expression) &&
            ts.isIdentifier(heritageType.expression.expression) &&
            heritageType.expression.expression.text === 'React' &&
            isReactClassComponentName(heritageType.expression.name.text)) {
            return true;
        }
        if (ts.isIdentifier(heritageType.expression) &&
            isReactClassComponentName(heritageType.expression.text)) {
            return true;
        }
    }
    return false;
}
export function isReactSfcFunctionDeclaration(functionDeclaration) {
    return (functionDeclaration.name != null &&
        /^[A-Z]\w*$/.test(functionDeclaration.name.text) &&
        functionDeclaration.parameters.length <= 2);
}
export function isReactSfcArrowFunction(variableStatement) {
    return (variableStatement.declarationList.declarations.length === 1 &&
        ts.isIdentifier(variableStatement.declarationList.declarations[0].name) &&
        /^[A-Z]\w*$/.test(variableStatement.declarationList.declarations[0].name.text) &&
        variableStatement.declarationList.declarations[0].initializer != null &&
        ts.isArrowFunction(variableStatement.declarationList.declarations[0].initializer) &&
        variableStatement.declarationList.declarations[0].initializer.parameters.length <= 2);
}
export function getReactComponentHeritageType(classDeclaration) {
    if (classDeclaration.heritageClauses &&
        classDeclaration.heritageClauses.length === 1 &&
        classDeclaration.heritageClauses[0].types.length === 1 &&
        ts.isExpressionWithTypeArguments(classDeclaration.heritageClauses[0].types[0])) {
        return classDeclaration.heritageClauses[0].types[0];
    }
    return undefined;
}
export function getNumComponentsInSourceFile(sourceFile) {
    const reactClassDeclarations = sourceFile.statements
        .filter(ts.isClassDeclaration)
        .filter(isReactClassComponent);
    const reactSfcFunctionDeclarations = sourceFile.statements
        .filter(ts.isFunctionDeclaration)
        .filter(isReactSfcFunctionDeclaration);
    const reactSfcArrowFunctions = sourceFile.statements
        .filter(ts.isVariableStatement)
        .filter(isReactSfcArrowFunction);
    return (reactClassDeclarations.length +
        reactSfcFunctionDeclarations.length +
        reactSfcArrowFunctions.length);
}
//# sourceMappingURL=react.js.map