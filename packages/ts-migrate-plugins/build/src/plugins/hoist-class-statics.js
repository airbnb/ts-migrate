/* eslint-disable no-use-before-define, @typescript-eslint/no-use-before-define */
import ts from 'typescript';
import updateSourceText from '../utils/updateSourceText';
import { findKnownImports, findKnownVariables, collectIdentifierNodes, } from './utils/identifiers';
const hoistClassStaticsPlugin = {
    name: 'hoist-class-statics',
    run({ fileName, text, options }) {
        return hoistStaticClassProperties(fileName, text, options);
    },
};
export default hoistClassStaticsPlugin;
/**
 * Determines whether or not we can hoist this identifier
 * @param identifier
 * @param hoistToPos -- the position we would hoist this identifier to
 * @param knownDefinitions -- a map describing any known imports or variable declarations
 */
function canHoistIdentifier(identifier, hoistToPos, knownDefinitions) {
    const globalWhitelist = ['Number', 'String', 'Object', 'Date', 'window', 'global'];
    const id = identifier.text;
    const isDefined = knownDefinitions[id] && knownDefinitions[id].end <= hoistToPos;
    const isGlobal = globalWhitelist.includes(id);
    return (isDefined ||
        isGlobal ||
        // e.g. in 'PropTypes.string.isRequired' allow the accessing identifiers 'string' and 'isRequired'
        (ts.isPropertyAccessExpression(identifier.parent) && identifier.parent.name === identifier) ||
        // e.g. in { foo: 'bar' } allow the assigned identifier key 'foo'
        (ts.isPropertyAssignment(identifier.parent) && identifier.parent.name === identifier) ||
        // e.g. in { foo() {} } allow foo
        (ts.isMethodDeclaration(identifier.parent) && identifier.parent.name === identifier));
}
/**
 * Determines whether or not we can hoist this expression
 * @param expression
 * @param hoistToPos -- the position we would hoist this expression to
 * @param knownDefinitions -- a map describing any known imports or variable declarations
 */
function canHoistExpression(expression, hoistToPos, knownDefinitions) {
    const allIdentifiers = collectIdentifierNodes(expression);
    return allIdentifiers.every((identifier) => canHoistIdentifier(identifier, hoistToPos, knownDefinitions));
}
/**
 * Determines whether or not this assignment was already hoisted to this class
 * @param statment -- a static binary expresison statement
 * @param classDeclaration -- the class declaration to hoist to
 */
function isAlreadyHoisted(statement, classDeclaration) {
    if (!ts.isBinaryExpression(statement.expression) ||
        !ts.isPropertyAccessExpression(statement.expression.left)) {
        return false;
    }
    const propertyToHoist = statement.expression.left.name.text;
    return classDeclaration.members.some((member) => member.name && ts.isIdentifier(member.name) && member.name.text === propertyToHoist);
}
function hoistStaticClassProperties(fileName, sourceText, options) {
    const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
    const printer = ts.createPrinter();
    const updates = [];
    const classDeclarations = sourceFile.statements.filter(ts.isClassDeclaration);
    const knownDefinitions = Object.assign(Object.assign({}, findKnownImports(sourceFile)), findKnownVariables(sourceFile));
    classDeclarations.forEach((classDeclaration) => {
        const className = classDeclaration.name;
        if (!className)
            return;
        const properties = [];
        sourceFile.statements.forEach((statement) => {
            if (ts.isExpressionStatement(statement) &&
                ts.isBinaryExpression(statement.expression) &&
                ts.isPropertyAccessExpression(statement.expression.left) &&
                ts.isIdentifier(statement.expression.left.expression) &&
                statement.expression.left.expression.text === className.text &&
                statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                if (isAlreadyHoisted(statement, classDeclaration)) {
                    return;
                }
                if (canHoistExpression(statement.expression.right, classDeclaration.pos, knownDefinitions)) {
                    properties.push(ts.createProperty(undefined, [ts.createModifier(ts.SyntaxKind.StaticKeyword)], statement.expression.left.name.text, undefined, undefined, statement.expression.right));
                    updates.push({
                        kind: 'delete',
                        index: statement.pos,
                        length: statement.end - statement.pos,
                    });
                }
                else {
                    // otherwise add a static type annotation for this expression
                    properties.push(ts.createProperty(undefined, [ts.createModifier(ts.SyntaxKind.StaticKeyword)], statement.expression.left.name.text, undefined, options.anyAlias != null
                        ? ts.createTypeReferenceNode(options.anyAlias, undefined)
                        : ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), undefined));
                }
            }
        });
        if (properties.length > 0) {
            if (classDeclaration.members.length === 0) {
                const updatedClassDeclaration = ts.updateClassDeclaration(classDeclaration, classDeclaration.decorators, classDeclaration.modifiers, classDeclaration.name, classDeclaration.typeParameters, classDeclaration.heritageClauses, ts.createNodeArray(properties));
                let index = classDeclaration.pos;
                while (index < sourceText.length && /\s/.test(sourceText[index]))
                    index += 1;
                const length = classDeclaration.end - index;
                const text = printer.printNode(ts.EmitHint.Unspecified, updatedClassDeclaration, sourceFile);
                updates.push({ kind: 'replace', index, length, text });
            }
            else {
                const text = ts.sys.newLine +
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
//# sourceMappingURL=hoist-class-statics.js.map