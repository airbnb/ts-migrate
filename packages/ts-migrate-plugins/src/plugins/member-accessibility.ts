/* eslint-disable no-bitwise */
import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';

type Options = {
  defaultAccessibility?: 'private' | 'protected' | 'public';
  privateRegex?: string;
  protectedRegex?: string;
  publicRegex?: string;
};

const memberAccessibilityPlugin: Plugin<Options> = {
  name: 'member-accessibility',
  run({ sourceFile, text, options }) {
    const result = ts.transform<ts.SourceFile>(sourceFile, [
      memberAccessibilityTransformerFactory(options),
    ]);
    const newSourceFile = result.transformed[0];
    if (newSourceFile === sourceFile) {
      return text;
    }
    const printer = ts.createPrinter();
    return printer.printFile(newSourceFile);
  },
};

export default memberAccessibilityPlugin;

const accessibilityMask =
  ts.ModifierFlags.Private | ts.ModifierFlags.Protected | ts.ModifierFlags.Public;

const memberAccessibilityTransformerFactory = (options: Options) => (
  context: ts.TransformationContext,
) => {
  let defaultAccessibility: ts.ModifierFlags;
  switch (options.defaultAccessibility) {
    case 'private':
      defaultAccessibility = ts.ModifierFlags.Private;
      break;
    case 'protected':
      defaultAccessibility = ts.ModifierFlags.Protected;
      break;
    case 'public':
      defaultAccessibility = ts.ModifierFlags.Public;
      break;
    default:
      defaultAccessibility = 0;
      break;
  }
  const privateRegex = options.privateRegex ? new RegExp(options.privateRegex) : null;
  const protectedRegex = options.protectedRegex ? new RegExp(options.protectedRegex) : null;
  const publicRegex = options.publicRegex ? new RegExp(options.publicRegex) : null;

  if (defaultAccessibility === 0 && !privateRegex && !protectedRegex && !publicRegex) {
    // Nothing to do. Don't bother traversing the AST.
    return <T extends ts.Node>(node: T) => node;
  }
  return visit;

  function visit<T extends ts.Node>(origNode: T): T {
    const node = ts.visitEachChild(origNode, visit, context);
    if (ts.isClassElement(node) && node.name && ts.isIdentifier(node.name)) {
      const modifierFlags = ts.getCombinedModifierFlags(node);
      if ((modifierFlags & accessibilityMask) !== 0) {
        // Don't overwrite existing modifier.
        return node;
      }

      const name = node.name.text;
      let accessibilityFlag = defaultAccessibility;
      if (privateRegex?.test(name)) {
        accessibilityFlag = ts.ModifierFlags.Private;
      } else if (protectedRegex?.test(name)) {
        accessibilityFlag = ts.ModifierFlags.Protected;
      } else if (publicRegex?.test(name)) {
        accessibilityFlag = ts.ModifierFlags.Public;
      }

      const newNode = ts.getMutableClone(node);
      newNode.modifiers = ts.createNodeArray(
        ts.createModifiersFromModifierFlags(modifierFlags | accessibilityFlag),
      );
      return newNode;
    }
    return node;
  }
};
