/* eslint-disable no-use-before-define, no-restricted-syntax */
import ts from 'typescript';
import { SourceTextUpdate } from '../../utils/updateSourceText';
import { getTextPreservingWhitespace } from './text';

export type DefaultImport = { defaultImport: string; moduleSpecifier: string };
export type NamedImport = { namedImport: string; moduleSpecifier: string };
export type ModuleImport = { moduleSpecifier: string };

type AddImport = DefaultImport | NamedImport;
type RemoveImport = DefaultImport | NamedImport | ModuleImport;
type AnyImport = DefaultImport | NamedImport | ModuleImport;

export function updateImports(
  sourceFile: ts.SourceFile,
  toAdd: AddImport[],
  toRemove: RemoveImport[],
) {
  const updates: SourceTextUpdate[] = [];
  const printer = ts.createPrinter();

  const usedIdentifiers = getUsedIdentifiers(sourceFile);
  const presentedImports = getPresentedImportIdentifiers(sourceFile);

  const toAddActual = uniqAddImportUpdates(toAdd).filter(
    (cur) =>
      (isDefaultImport(cur) &&
        usedIdentifiers.has(cur.defaultImport) &&
        !presentedImports.has(cur.defaultImport)) ||
      (isNamedImport(cur) &&
        usedIdentifiers.has(cur.namedImport) &&
        !presentedImports.has(cur.namedImport)),
  );
  const added = new Set<AddImport>();
  const isNotAdded = (cur: AddImport) => !added.has(cur);

  const importDeclarations = sourceFile.statements.filter(ts.isImportDeclaration);
  importDeclarations.forEach((importDeclaration) => {
    if (!importDeclaration.importClause) return;

    const moduleSpecifierText = importDeclaration.moduleSpecifier
      .getText(sourceFile)
      .replace(/['"]/g, '');

    const isModuleSpecifier = (cur: AnyImport) => cur.moduleSpecifier === moduleSpecifierText;

    let { importClause } = importDeclaration;

    const shouldRemoveAllUnused = toRemove.filter(isModuleImport).some(isModuleSpecifier);

    const shouldRemoveNameUnused = toRemove
      .filter(isDefaultImport)
      .some(
        (cur) =>
          cur.moduleSpecifier === moduleSpecifierText &&
          importClause.name != null &&
          cur.defaultImport != null &&
          cur.defaultImport === importClause.name.text,
      );

    if (
      (shouldRemoveAllUnused || shouldRemoveNameUnused) &&
      importClause.name &&
      !usedIdentifiers.has(importClause.name.text)
    ) {
      importClause = ts.factory.updateImportClause(
        importClause,
        importClause.isTypeOnly,
        undefined,
        importClause.namedBindings,
      );
    }

    toAddActual
      .filter(isDefaultImport)
      .filter(isModuleSpecifier)
      .filter(isNotAdded)
      .filter((cur) => importClause.name && cur.defaultImport === importClause.name.text)
      .forEach((cur) => added.add(cur));

    const nameToAdd = toAddActual
      .filter(isDefaultImport)
      .filter(isModuleSpecifier)
      .filter(isNotAdded);
    if (nameToAdd.length > 0 && importClause.name == null) {
      importClause = ts.factory.updateImportClause(
        importClause,
        importClause.isTypeOnly,
        ts.factory.createIdentifier(nameToAdd[0].defaultImport),
        importClause.namedBindings,
      );
      added.add(nameToAdd[0]);
    }

    if (
      shouldRemoveAllUnused &&
      importClause.namedBindings &&
      ts.isNamespaceImport(importClause.namedBindings) &&
      !usedIdentifiers.has(importClause.namedBindings.name.text)
    ) {
      importClause = ts.factory.updateImportClause(
        importClause,
        importClause.isTypeOnly,
        importClause.name,
        undefined,
      );
    }

    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      const elements = importClause.namedBindings.elements.filter((el) => {
        const isUsed = usedIdentifiers.has(el.name.text);
        if (isUsed) return true;

        const shouldRemove =
          shouldRemoveAllUnused ||
          toRemove
            .filter(isNamedImport)
            .filter(isModuleSpecifier)
            .some((cur) => cur.namedImport === el.name.text);

        return !shouldRemove;
      });

      toAddActual
        .filter(isNamedImport)
        .filter(isModuleSpecifier)
        .filter(isNotAdded)
        .filter((cur) => elements.some((el) => el.name.text === cur.namedImport))
        .forEach((cur) => added.add(cur));

      if (elements.length !== importClause.namedBindings.elements.length) {
        importClause = ts.factory.updateImportClause(
          importClause,
          importClause.isTypeOnly,
          importClause.name,
          elements.length > 0
            ? ts.factory.updateNamedImports(importClause.namedBindings, elements)
            : undefined,
        );
      }
    }

    const namedToAdd = toAddActual
      .filter(isNamedImport)
      .filter(isModuleSpecifier)
      .filter(isNotAdded);
    if (namedToAdd.length > 0) {
      importClause = ts.factory.updateImportClause(
        importClause,
        importClause.isTypeOnly,
        importClause.name,
        ts.factory.createNamedImports([
          ...(importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)
            ? importClause.namedBindings.elements
            : []),
          ...namedToAdd.map((cur) =>
            ts.factory.createImportSpecifier(
              false,
              undefined,
              ts.factory.createIdentifier(cur.namedImport),
            ),
          ),
        ]),
      );
      namedToAdd.forEach((cur) => added.add(cur));
    }

    if (importClause !== importDeclaration.importClause) {
      let numImports = 0;
      if (importClause.name) {
        numImports += 1;
      }
      if (importClause.namedBindings) {
        if (ts.isNamespaceImport(importClause.namedBindings)) {
          numImports += 1;
        }
        if (ts.isNamedImports(importClause.namedBindings)) {
          numImports += importClause.namedBindings.elements.length;
        }
      }

      if (numImports > 0) {
        const upImpDec = ts.factory.updateImportDeclaration(
          importDeclaration,
          importDeclaration.decorators,
          importDeclaration.modifiers,
          importClause,
          importDeclaration.moduleSpecifier,
          importDeclaration.assertClause,
        );
        const text = getTextPreservingWhitespace(importDeclaration, upImpDec, sourceFile);
        updates.push({
          kind: 'replace',
          index: importDeclaration.pos,
          length: importDeclaration.end - importDeclaration.pos,
          text,
        });
      } else {
        const comments =
          ts.getLeadingCommentRanges(sourceFile.getFullText(), importDeclaration.pos) || [];
        const index =
          comments.length > 0 ? comments[comments.length - 1].end : importDeclaration.pos;
        updates.push({
          kind: 'delete',
          index,
          length: importDeclaration.end - index,
        });
      }
    }
  });

  const toAddRemaining = toAddActual.filter(isNotAdded);
  if (toAddRemaining.length > 0) {
    const nodes: ts.Node[] = [];

    const grouped: { [moduleSpecifier: string]: AddImport[] } = {};
    toAddRemaining.forEach((cur) => {
      grouped[cur.moduleSpecifier] = grouped[cur.moduleSpecifier] || [];
      grouped[cur.moduleSpecifier].push(cur);
    });

    Object.keys(grouped).forEach((moduleSpecifier) => {
      const nameToAdd = grouped[moduleSpecifier].filter(isDefaultImport);
      const namedToAdd = grouped[moduleSpecifier].filter(isNamedImport);

      const namedImports =
        namedToAdd.length > 0
          ? ts.factory.createNamedImports(
              namedToAdd.map((cur) =>
                ts.factory.createImportSpecifier(
                  false,
                  undefined,
                  ts.factory.createIdentifier(cur.namedImport),
                ),
              ),
            )
          : undefined;

      if (nameToAdd.length <= 1) {
        nodes.push(
          ts.factory.createImportDeclaration(
            undefined,
            undefined,
            ts.factory.createImportClause(
              false,
              nameToAdd.length === 1
                ? ts.factory.createIdentifier(nameToAdd[0].defaultImport)
                : undefined,
              namedImports,
            ),
            ts.factory.createStringLiteral(moduleSpecifier),
          ),
        );
      } else {
        nodes.push(
          ts.factory.createImportDeclaration(
            undefined,
            undefined,
            ts.factory.createImportClause(false, undefined, namedImports),
            ts.factory.createStringLiteral(moduleSpecifier),
          ),
        );
        nameToAdd.forEach((cur) => {
          nodes.push(
            ts.factory.createImportDeclaration(
              undefined,
              undefined,
              ts.factory.createImportClause(
                false,
                ts.factory.createIdentifier(cur.defaultImport),
                undefined,
              ),
              ts.factory.createStringLiteral(moduleSpecifier),
            ),
          );
        });
      }
    });

    const pos =
      importDeclarations.length > 0 ? importDeclarations[importDeclarations.length - 1].end : 0;
    nodes.forEach((node, i) => {
      let text = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
      if (pos > 0 || i > 0) text = `\n${text}`;

      updates.push({ kind: 'insert', index: pos, text });
    });
  }

  return updates;
}

function getUsedIdentifiers(sourceFile: ts.SourceFile) {
  const usedIdentifiers = new Set<string>();
  const visitor = (node: ts.Node) => {
    if (ts.isIdentifier(node)) {
      usedIdentifiers.add(node.text);
    }
    // Don't visit the import statements themselves.
    if (!ts.isImportDeclaration(node)) {
      ts.forEachChild(node, visitor);
    }
  };
  ts.forEachChild(sourceFile, visitor);

  return usedIdentifiers;
}

function getPresentedImportIdentifiers(sourceFile: ts.SourceFile) {
  return sourceFile.statements.filter(ts.isImportDeclaration).reduce((presentedImports, item) => {
    if (item.importClause) {
      if (item.importClause.namedBindings && ts.isNamedImports(item.importClause.namedBindings)) {
        item.importClause.namedBindings.elements.forEach(
          (x) => x.name && presentedImports.add(x.name.escapedText.toString()),
        );
      } else if (item.importClause.name && ts.isIdentifier(item.importClause.name)) {
        presentedImports.add(item.importClause.name.text);
      }
    }
    return presentedImports;
  }, new Set<string>());
}

function isDefaultImport(update: AnyImport): update is DefaultImport {
  return (update as DefaultImport).defaultImport != null;
}

function isNamedImport(update: AnyImport): update is NamedImport {
  return (update as NamedImport).namedImport != null;
}

function isModuleImport(update: AnyImport): update is ModuleImport {
  return (
    update.moduleSpecifier != null &&
    (update as DefaultImport).defaultImport == null &&
    (update as NamedImport).namedImport == null
  );
}

function uniqAddImportUpdates(updates: AddImport[]): AddImport[] {
  const seen: { [moduleSpecifier: string]: { name: Set<string>; namedImport: Set<string> } } = {};

  const initSeen = (moduleSpecifier: string) => {
    if (!seen[moduleSpecifier]) {
      seen[moduleSpecifier] = { name: new Set(), namedImport: new Set() };
    }
  };

  const isSeen = (update: DefaultImport | NamedImport) => {
    initSeen(update.moduleSpecifier);
    return (
      (isDefaultImport(update) && seen[update.moduleSpecifier].name.has(update.defaultImport)) ||
      (isNamedImport(update) && seen[update.moduleSpecifier].namedImport.has(update.namedImport))
    );
  };

  const markAsSeen = (update: DefaultImport | NamedImport) => {
    initSeen(update.moduleSpecifier);
    if (isDefaultImport(update)) {
      seen[update.moduleSpecifier].name.add(update.defaultImport);
    } else if (isNamedImport(update)) {
      seen[update.moduleSpecifier].namedImport.add(update.namedImport);
    }
  };

  const newUpdates: AddImport[] = [];
  for (const update of updates) {
    if (!isSeen(update)) {
      newUpdates.push(update);
      markAsSeen(update);
    }
  }

  return newUpdates;
}
