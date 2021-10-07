/* eslint-disable no-bitwise */
import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import {
  AnyAliasOptions,
  Properties,
  anyAliasProperty,
  createValidate,
} from '../utils/validateOptions';
import UpdateTracker from './utils/update';

type TypeMap = Record<string, TypeOptions>;

type TypeOptions =
  | string
  | {
      tsName?: string;
      acceptsTypeParameters?: boolean;
    };

const defaultTypeMap: TypeMap = {
  String: {
    tsName: 'string',
    acceptsTypeParameters: false,
  },
  Boolean: {
    tsName: 'boolean',
    acceptsTypeParameters: false,
  },
  Number: {
    tsName: 'number',
    acceptsTypeParameters: false,
  },
  Object: {
    tsName: 'object',
    // Object<string, T> and Object<number, T> are handled as a special case.
    acceptsTypeParameters: false,
  },
  date: {
    tsName: 'Date',
    acceptsTypeParameters: false,
  },
  array: 'Array',
  promise: 'Promise',
};

type Options = {
  annotateReturns?: boolean;
  typeMap?: TypeMap;
} & AnyAliasOptions;

const optionProperties: Properties = {
  ...anyAliasProperty,
  annotateReturns: { type: 'boolean' },
  typeMap: {
    oneOf: [
      { type: 'string' },
      {
        type: 'object',
        properties: { tsName: { type: 'string' }, acceptsTypeParameters: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
  },
};

const jsDocPlugin: Plugin<Options> = {
  name: 'jsdoc',

  run({ sourceFile, options }) {
    const updates = new UpdateTracker(sourceFile);
    ts.transform(sourceFile, [jsDocTransformerFactory(updates, options)]);
    return updates.apply();
  },

  validate: createValidate(optionProperties),
};

export default jsDocPlugin;

const jsDocTransformerFactory =
  (updates: UpdateTracker, { annotateReturns, anyAlias, typeMap: optionsTypeMap }: Options) =>
  (context: ts.TransformationContext) => {
    const { factory } = context;
    const anyType = anyAlias
      ? factory.createTypeReferenceNode(anyAlias, undefined)
      : factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    const typeMap: TypeMap = { ...defaultTypeMap, ...optionsTypeMap };
    return (file: ts.SourceFile) => {
      visit(file);
      return file;
    };

    function visit(origNode: ts.Node): void {
      origNode.forEachChild(visit);
      if (ts.isFunctionLike(origNode)) {
        visitFunctionLike(origNode, ts.isClassDeclaration(origNode.parent));
      }
    }

    function visitFunctionLike(node: ts.SignatureDeclaration, insideClass: boolean): void {
      const modifiers =
        ts.isMethodDeclaration(node) && insideClass
          ? modifiersFromJSDoc(node, factory)
          : node.modifiers;
      const parameters = visitParameters(node);
      const returnType = annotateReturns ? visitReturnType(node) : node.type;
      if (
        modifiers === node.modifiers &&
        parameters === node.parameters &&
        returnType === node.type
      ) {
        return;
      }

      const newModifiers = modifiers ? factory.createNodeArray(modifiers) : undefined;
      if (newModifiers) {
        if (node.modifiers) {
          updates.replaceNodes(node.modifiers, newModifiers);
        } else {
          const pos = node.name!.getStart();
          updates.insertNodes(pos, newModifiers);
        }
      }

      const newParameters = factory.createNodeArray(parameters);
      const addParens =
        ts.isArrowFunction(node) && node.getFirstToken()?.kind !== ts.SyntaxKind.OpenParenToken;
      updates.replaceNodes(node.parameters, newParameters, addParens);

      const newType = returnType;
      if (newType) {
        updates.addReturnAnnotation(node, newType);
      }
    }

    function visitParameters(
      functionDeclaration: ts.SignatureDeclaration,
    ): ReadonlyArray<ts.ParameterDeclaration> {
      if (!ts.hasJSDocParameterTags(functionDeclaration)) {
        return functionDeclaration.parameters;
      }

      // create a new function declaration with a new type
      const newParams = functionDeclaration.parameters.map((param) => {
        if (param.type) {
          // Don't overwrite existing annotations.
          return param;
        }

        const paramNode = ts.getJSDocParameterTags(param).find((tag) => tag.typeExpression);
        if (!paramNode || !paramNode.typeExpression) {
          return param;
        }
        const typeNode = paramNode.typeExpression.type;
        const type = visitJSDocType(typeNode, true);

        const questionToken =
          !param.initializer &&
          ts.isIdentifier(param.name) &&
          (paramNode.isBracketed || ts.isJSDocOptionalType(typeNode))
            ? factory.createToken(ts.SyntaxKind.QuestionToken)
            : param.questionToken;

        const newParam = factory.createParameterDeclaration(
          param.decorators,
          param.modifiers,
          param.dotDotDotToken,
          param.name,
          questionToken,
          type,
          param.initializer,
        );

        return newParam;
      });
      if (functionDeclaration.parameters.some((param, i) => param !== newParams[i])) {
        // Only return the new array if something changed.
        return newParams;
      }
      return functionDeclaration.parameters;
    }

    function visitReturnType(
      functionDeclaration: ts.SignatureDeclaration,
    ): ts.TypeNode | undefined {
      if (functionDeclaration.type) {
        // Don't overwrite existing annotations.
        return functionDeclaration.type;
      }
      const returnTypeNode = ts.getJSDocReturnType(functionDeclaration);
      if (!returnTypeNode) {
        return functionDeclaration.type;
      }
      return visitJSDocType(returnTypeNode);
    }

    // All visitJSDoc functions are adapted from:
    // https://github.com/microsoft/TypeScript/blob/v4.0.2/src/services/codefixes/annotateWithTypeFromJSDoc.ts

    function visitJSDocType(node: ts.Node, topLevelParam = false): ts.TypeNode {
      switch (node.kind) {
        case ts.SyntaxKind.JSDocAllType:
        case ts.SyntaxKind.JSDocUnknownType:
          return anyType;
        case ts.SyntaxKind.JSDocOptionalType:
          if (topLevelParam) {
            // Ignore the optionality.
            // We'll make the entire parameter optional inside visitParameters
            return visitJSDocType((node as ts.JSDocOptionalType).type);
          }
          return visitJSDocOptionalType(node as ts.JSDocOptionalType);

        case ts.SyntaxKind.JSDocNonNullableType:
          return visitJSDocType((node as ts.JSDocNonNullableType).type);
        case ts.SyntaxKind.JSDocNullableType:
          return visitJSDocNullableType(node as ts.JSDocNullableType);
        case ts.SyntaxKind.JSDocVariadicType:
          return visitJSDocVariadicType(node as ts.JSDocVariadicType);
        case ts.SyntaxKind.JSDocFunctionType:
          return visitJSDocFunctionType(node as ts.JSDocFunctionType);
        case ts.SyntaxKind.JSDocTypeLiteral:
          return visitJSDocTypeLiteral(node as ts.JSDocTypeLiteral);
        case ts.SyntaxKind.TypeReference:
          return visitJSDocTypeReference(node as ts.TypeReferenceNode);
        default: {
          const visited = ts.visitEachChild(node, visitJSDocType, context);
          ts.setEmitFlags(visited, ts.EmitFlags.SingleLine);
          return visited as ts.TypeNode;
        }
      }
    }

    function visitJSDocOptionalType(node: ts.JSDocOptionalType) {
      return factory.createUnionTypeNode([
        ts.visitNode(node.type, visitJSDocType),
        factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
      ]);
    }

    function visitJSDocNullableType(node: ts.JSDocNullableType) {
      return factory.createUnionTypeNode([
        ts.visitNode(node.type, visitJSDocType),
        factory.createLiteralTypeNode(factory.createToken(ts.SyntaxKind.NullKeyword)),
      ]);
    }

    function visitJSDocVariadicType(node: ts.JSDocVariadicType) {
      return factory.createArrayTypeNode(ts.visitNode(node.type, visitJSDocType));
    }

    function visitJSDocFunctionType(node: ts.JSDocFunctionType) {
      return factory.createFunctionTypeNode(
        undefined,
        node.parameters.map(visitJSDocParameter),
        node.type ?? anyType,
      );
    }

    function visitJSDocTypeLiteral(node: ts.JSDocTypeLiteral) {
      const propertySignatures: ts.PropertySignature[] = [];
      if (node.jsDocPropertyTags) {
        node.jsDocPropertyTags.forEach((tag) => {
          const property = visitJSDocPropertyLikeTag(tag);
          if (property) {
            propertySignatures.push(property);
          }
        });
      }
      return factory.createTypeLiteralNode(propertySignatures);
    }

    function visitJSDocPropertyLikeTag(node: ts.JSDocPropertyLikeTag) {
      let optionalType = false;
      let type;
      if (node.typeExpression) {
        type = visitJSDocType(node.typeExpression.type);
        optionalType = ts.isJSDocOptionalType(node.typeExpression);
      } else {
        type = anyType;
      }
      const questionToken =
        node.isBracketed || optionalType
          ? factory.createToken(ts.SyntaxKind.QuestionToken)
          : undefined;
      if (ts.isIdentifier(node.name)) {
        return factory.createPropertySignature(undefined, node.name, questionToken, type);
      }
      // Assumption: the leaf field on the QualifiedName belongs directly to the parent object type.
      return factory.createPropertySignature(undefined, node.name.right, questionToken, type);
    }

    function visitJSDocParameter(node: ts.ParameterDeclaration) {
      if (!node.type) {
        return node;
      }
      const index = node.parent.parameters.indexOf(node);
      const isRest =
        node.type.kind === ts.SyntaxKind.JSDocVariadicType &&
        index === node.parent.parameters.length - 1;
      const name = node.name || (isRest ? 'rest' : `arg${index}`);
      const dotdotdot = isRest
        ? factory.createToken(ts.SyntaxKind.DotDotDotToken)
        : node.dotDotDotToken;
      return factory.createParameterDeclaration(
        node.decorators,
        node.modifiers,
        dotdotdot,
        name,
        node.questionToken,
        ts.visitNode(node.type, visitJSDocType),
        node.initializer,
      );
    }

    function visitJSDocTypeReference(node: ts.TypeReferenceNode) {
      let name = node.typeName;
      let args = node.typeArguments;
      if (ts.isIdentifier(node.typeName)) {
        if (isJSDocIndexSignature(node)) {
          return visitJSDocIndexSignature(node);
        }
        let { text } = node.typeName;
        let acceptsTypeParameters = true;
        if (text in typeMap) {
          const typeOptions = typeMap[text];
          if (typeof typeOptions === 'string') {
            text = typeOptions;
          } else {
            if (typeOptions.tsName) {
              text = typeOptions.tsName;
            }
            acceptsTypeParameters = typeOptions.acceptsTypeParameters !== false;
          }
        }

        name = factory.createIdentifier(text);
        if ((text === 'Array' || text === 'Promise') && !node.typeArguments) {
          args = factory.createNodeArray([anyType]);
        } else if (acceptsTypeParameters) {
          args = ts.visitNodes(node.typeArguments, visitJSDocType);
        }
        if (!acceptsTypeParameters) {
          args = undefined;
        }
      }
      return factory.createTypeReferenceNode(name, args);
    }

    function visitJSDocIndexSignature(node: ts.TypeReferenceNode) {
      const typeArguments = node.typeArguments!;
      const index = factory.createParameterDeclaration(
        /* decorators */ undefined,
        /* modifiers */ undefined,
        /* dotDotDotToken */ undefined,
        typeArguments[0].kind === ts.SyntaxKind.NumberKeyword ? 'n' : 's',
        /* questionToken */ undefined,
        factory.createTypeReferenceNode(
          typeArguments[0].kind === ts.SyntaxKind.NumberKeyword ? 'number' : 'string',
          [],
        ),
        /* initializer */ undefined,
      );
      const indexSignature = factory.createTypeLiteralNode([
        factory.createIndexSignature(
          /* decorators */ undefined,
          /* modifiers */ undefined,
          [index],
          typeArguments[1],
        ),
      ]);
      ts.setEmitFlags(indexSignature, ts.EmitFlags.SingleLine);
      return indexSignature;
    }
  };

const accessibilityMask =
  ts.ModifierFlags.Private | ts.ModifierFlags.Protected | ts.ModifierFlags.Public;

function modifiersFromJSDoc(
  methodDeclaration: ts.MethodDeclaration,
  factory: ts.NodeFactory,
): ReadonlyArray<ts.Modifier> | undefined {
  let modifierFlags = ts.getCombinedModifierFlags(methodDeclaration);
  if ((modifierFlags & accessibilityMask) !== 0) {
    // Don't overwrite existing accessibility modifier.
    return methodDeclaration.modifiers;
  }

  if (ts.getJSDocPrivateTag(methodDeclaration)) {
    modifierFlags |= ts.ModifierFlags.Private;
  } else if (ts.getJSDocProtectedTag(methodDeclaration)) {
    modifierFlags |= ts.ModifierFlags.Protected;
  } else if (ts.getJSDocPublicTag(methodDeclaration)) {
    modifierFlags |= ts.ModifierFlags.Public;
  } else {
    return methodDeclaration.modifiers;
  }

  return factory.createModifiersFromModifierFlags(modifierFlags);
}

// Copied from: https://github.com/microsoft/TypeScript/blob/v4.0.2/src/compiler/utilities.ts#L1879
function isJSDocIndexSignature(node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments) {
  return (
    ts.isTypeReferenceNode(node) &&
    ts.isIdentifier(node.typeName) &&
    node.typeName.escapedText === 'Object' &&
    node.typeArguments &&
    node.typeArguments.length === 2 &&
    (node.typeArguments[0].kind === ts.SyntaxKind.StringKeyword ||
      node.typeArguments[0].kind === ts.SyntaxKind.NumberKeyword)
  );
}
