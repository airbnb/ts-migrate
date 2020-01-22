import ts from 'typescript';

export type KnownDefinitionMap = { [key: string]: { pos: number; end: number } };

/**
 * Recursively finds all identifier nodes within/including a given node
 * Note: this requires parent nodes to be set because it relies on generic parent - child relationships.
 * @param root
 */
export function collectIdentifierNodes(root: ts.Node): ts.Identifier[] {
  const identifiers: ts.Identifier[] = [];
  const visitor = (node: ts.Node) => {
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
export function collectIdentifiers(sourceFile: ts.SourceFile): Set<string> {
  const identifiers = collectIdentifierNodes(sourceFile);
  return identifiers.reduce((identifierStrings: Set<string>, identifierNode: ts.Identifier) => {
    identifierStrings.add(identifierNode.text);
    return identifierStrings;
  }, new Set<string>());
}

/**
 * Finds known imports
 * @param sourceFile
 */
export function findKnownImports(sourceFile: ts.SourceFile): KnownDefinitionMap {
  const importDeclarations = sourceFile.statements.filter(ts.isImportDeclaration);
  const knownImports: KnownDefinitionMap = {};

  importDeclarations.forEach((importDeclaration: ts.ImportDeclaration) => {
    const { importClause } = importDeclaration;
    if (!importClause) {
      return;
    }
    const identifiers = collectIdentifierNodes(importClause);
    identifiers.forEach((identifier: ts.Identifier) => {
      knownImports[identifier.text] = { pos: identifier.pos, end: importClause.end };
    });
  });
  return knownImports;
}

export function findKnownVariables(sourceFile: ts.SourceFile): KnownDefinitionMap {
  const variableStatements = sourceFile.statements.filter(ts.isVariableStatement);
  const knownVariables: KnownDefinitionMap = {};

  variableStatements.forEach((statement: ts.VariableStatement) => {
    const { declarations } = statement.declarationList;
    declarations.forEach((declaration: ts.VariableDeclaration) => {
      const identifiers = collectIdentifierNodes(declaration.name);
      identifiers.forEach((identifier: ts.Identifier) => {
        knownVariables[identifier.text] = { pos: identifier.pos, end: declaration.end };
      });
    });
  });
  return knownVariables;
}
