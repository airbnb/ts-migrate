import ts from 'typescript';
/**
 * Recursively finds all identifier nodes within/including a given node
 * Note: this requires parent nodes to be set because it relies on generic parent - child relationships.
 * @param root
 */
export function collectIdentifierNodes(root) {
    const identifiers = [];
    const visitor = (node) => {
        if (ts.isIdentifier(node)) {
            identifiers.push(node);
        }
        ts.forEachChild(node, visitor);
    };
    visitor(root);
    return identifiers;
}
/**
 * Returns a set of all the identifier names within the given source file
 * @param sourceFile
 */
export function collectIdentifiers(sourceFile) {
    const identifiers = collectIdentifierNodes(sourceFile);
    return identifiers.reduce((identifierStrings, identifierNode) => {
        identifierStrings.add(identifierNode.text);
        return identifierStrings;
    }, new Set());
}
/**
 * Finds known imports
 * @param sourceFile
 */
export function findKnownImports(sourceFile) {
    const importDeclarations = sourceFile.statements.filter(ts.isImportDeclaration);
    const knownImports = {};
    importDeclarations.forEach((importDeclaration) => {
        const { importClause } = importDeclaration;
        if (!importClause) {
            return;
        }
        const identifiers = collectIdentifierNodes(importClause);
        identifiers.forEach((identifier) => {
            knownImports[identifier.text] = { pos: identifier.pos, end: importClause.end };
        });
    });
    return knownImports;
}
export function findKnownVariables(sourceFile) {
    const variableStatements = sourceFile.statements.filter(ts.isVariableStatement);
    const knownVariables = {};
    variableStatements.forEach((statement) => {
        const { declarations } = statement.declarationList;
        declarations.forEach((declaration) => {
            const identifiers = collectIdentifierNodes(declaration.name);
            identifiers.forEach((identifier) => {
                knownVariables[identifier.text] = { pos: identifier.pos, end: declaration.end };
            });
        });
    });
    return knownVariables;
}
//# sourceMappingURL=identifiers.js.map