/* eslint-disable no-bitwise */
import ts from 'typescript';
import { Plugin, PluginOptionsError } from 'ts-migrate-server';

import { Properties, validateOptions } from '../utils/validateOptions';

const accessibility = ['private' as const, 'protected' as const, 'public' as const];

type Options = {
  defaultAccessibility?: typeof accessibility[number];
  privateRegex?: string;
  protectedRegex?: string;
  publicRegex?: string;
};

const optionProperties: Properties = {
  defaultAccessibility: { enum: accessibility },
  privateRegex: { type: 'string' },
  protectedRegex: { type: 'string' },
  publicRegex: { type: 'string' },
};

const memberAccessibilityPlugin: Plugin<Options> = {
  name: 'member-accessibility',

  run({ sourceFile, text, options }) {
    const result = ts.transform(sourceFile, [memberAccessibilityTransformerFactory(options)]);
    const newSourceFile = result.transformed[0];
    if (newSourceFile === sourceFile) {
      return text;
    }
    const printer = ts.createPrinter();
    return printer.printFile(newSourceFile);
  },

  validate(options: unknown): options is Options {
    const valid = validateOptions(options, optionProperties);

    if (valid) {
      // Validate regex property syntax.
      // This can't be covered by JSON schema.
      const validOptions = options as Options;
      accessibility.forEach((accessibility) => {
        const key = `${accessibility}Regex` as const;
        const value = validOptions[key];
        if (value) {
          try {
            RegExp(value);
          } catch (e: any) {
            throw new PluginOptionsError(`${key}: ${e.message}`);
          }
        }
      });
    }

    return true;
  },
};

export default memberAccessibilityPlugin;

const accessibilityMask =
  ts.ModifierFlags.Private | ts.ModifierFlags.Protected | ts.ModifierFlags.Public;

const memberAccessibilityTransformerFactory =
  (options: Options) => (context: ts.TransformationContext) => {
    const { factory } = context;
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
      return (file: ts.SourceFile) => file;
    }
    return (file: ts.SourceFile) => ts.visitNode(file, visit);

    function visit(origNode: ts.Node): ts.Node {
      const node = ts.visitEachChild(origNode, visit, context);
      if (
        ts.isClassElement(node) &&
        ts.isClassLike(node.parent) &&
        node.name &&
        ts.isIdentifier(node.name)
      ) {
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

        const modifiers = factory.createNodeArray(
          factory.createModifiersFromModifierFlags(modifierFlags | accessibilityFlag),
        );
        switch (node.kind) {
          case ts.SyntaxKind.PropertyDeclaration: {
            const propertyNode = node as ts.PropertyDeclaration;
            return factory.updatePropertyDeclaration(
              propertyNode,
              propertyNode.decorators,
              modifiers,
              propertyNode.name,
              propertyNode.questionToken,
              propertyNode.type,
              propertyNode.initializer,
            );
          }
          case ts.SyntaxKind.MethodDeclaration: {
            const methodNode = node as ts.MethodDeclaration;
            return factory.updateMethodDeclaration(
              methodNode,
              methodNode.decorators,
              modifiers,
              methodNode.asteriskToken,
              methodNode.name,
              methodNode.questionToken,
              methodNode.typeParameters,
              methodNode.parameters,
              methodNode.type,
              methodNode.body,
            );
          }
          case ts.SyntaxKind.GetAccessor: {
            const accessorNode = node as ts.GetAccessorDeclaration;
            return factory.updateGetAccessorDeclaration(
              accessorNode,
              accessorNode.decorators,
              modifiers,
              accessorNode.name,
              accessorNode.parameters,
              accessorNode.type,
              accessorNode.body,
            );
          }
          case ts.SyntaxKind.SetAccessor: {
            const accessorNode = node as ts.SetAccessorDeclaration;
            return factory.updateSetAccessorDeclaration(
              accessorNode,
              accessorNode.decorators,
              modifiers,
              accessorNode.name,
              accessorNode.parameters,
              accessorNode.body,
            );
          }
          default:
            // Should be impossible.
            return node;
        }
      }
      return node;
    }
  };
