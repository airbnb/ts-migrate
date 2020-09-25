/* eslint-disable no-bitwise */
import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';

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
  anyAlias?: string;
  typeMap?: TypeMap;
};

const jsDocPlugin: Plugin<Options> = {
  name: 'jsdoc',
  run({ sourceFile, text, options }) {
    const result = ts.transform<ts.SourceFile>(sourceFile, [jsDocTransformerFactory(options)]);
    const newSourceFile = result.transformed[0];
    if (newSourceFile === sourceFile) {
      return text;
    }
    const printer = ts.createPrinter();
    return printer.printFile(newSourceFile);
  },
};

export default jsDocPlugin;

const jsDocTransformerFactory = ({
  annotateReturns,
  anyAlias,
  typeMap: optionsTypeMap,
}: Options) => (context: ts.TransformationContext) => {
  const anyType = anyAlias
    ? ts.createTypeReferenceNode(anyAlias, undefined)
    : ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  const typeMap: TypeMap = { ...defaultTypeMap, ...optionsTypeMap };

  function visit<T extends ts.Node>(origNode: T): T {
    const node = ts.visitEachChild(origNode, visit, context);
    if (ts.isFunctionLike(node)) {
      return visitFunctionLike(node, ts.isClassDeclaration(origNode.parent));
    }
    return node;
  }

  function visitFunctionLike<T extends ts.SignatureDeclaration>(node: T, insideClass: boolean): T {
    const modifiers =
      ts.isMethodDeclaration(node) && insideClass ? modifiersFromJSDoc(node) : node.modifiers;
    const parameters = visitParameters(node);
    const returnType = annotateReturns ? visitReturnType(node) : node.type;
    if (
      modifiers === node.modifiers &&
      parameters === node.parameters &&
      returnType === node.type
    ) {
      return node;
    }

    const newNode = ts.getMutableClone(node) as any;
    newNode.modifiers = ts.createNodeArray(modifiers);
    newNode.parameters = ts.createNodeArray(parameters);
    newNode.type = returnType;
    return newNode;
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
          ? ts.createToken(ts.SyntaxKind.QuestionToken)
          : param.questionToken;

      const newParam = ts.createParameter(
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

  function visitReturnType(functionDeclaration: ts.SignatureDeclaration): ts.TypeNode | undefined {
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
    return ts.createUnionTypeNode([
      ts.visitNode(node.type, visitJSDocType),
      ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    ]);
  }

  function visitJSDocNullableType(node: ts.JSDocNullableType) {
    return ts.createUnionTypeNode([
      ts.visitNode(node.type, visitJSDocType),
      ts.createKeywordTypeNode(ts.SyntaxKind.NullKeyword as any),
    ]);
  }

  function visitJSDocVariadicType(node: ts.JSDocVariadicType) {
    return ts.createArrayTypeNode(ts.visitNode(node.type, visitJSDocType));
  }

  function visitJSDocFunctionType(node: ts.JSDocFunctionType) {
    return ts.createFunctionTypeNode(
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
    return ts.createTypeLiteralNode(propertySignatures);
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
      node.isBracketed || optionalType ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined;
    if (ts.isIdentifier(node.name)) {
      return ts.createPropertySignature(undefined, node.name, questionToken, type, undefined);
    }
    // Assumption: the leaf field on the QualifiedName belongs directly to the parent object type.
    return ts.createPropertySignature(undefined, node.name.right, questionToken, type, undefined);
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
    const dotdotdot = isRest ? ts.createToken(ts.SyntaxKind.DotDotDotToken) : node.dotDotDotToken;
    return ts.createParameter(
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

      name = ts.createIdentifier(text);
      if ((text === 'Array' || text === 'Promise') && !node.typeArguments) {
        args = ts.createNodeArray([anyType]);
      } else if (acceptsTypeParameters) {
        args = ts.visitNodes(node.typeArguments, visitJSDocType);
      }
      if (!acceptsTypeParameters) {
        args = undefined;
      }
    }
    return ts.createTypeReferenceNode(name, args);
  }

  function visitJSDocIndexSignature(node: ts.TypeReferenceNode) {
    const typeArguments = node.typeArguments!;
    const index = ts.createParameter(
      /* decorators */ undefined,
      /* modifiers */ undefined,
      /* dotDotDotToken */ undefined,
      typeArguments[0].kind === ts.SyntaxKind.NumberKeyword ? 'n' : 's',
      /* questionToken */ undefined,
      ts.createTypeReferenceNode(
        typeArguments[0].kind === ts.SyntaxKind.NumberKeyword ? 'number' : 'string',
        [],
      ),
      /* initializer */ undefined,
    );
    const indexSignature = ts.createTypeLiteralNode([
      ts.createIndexSignature(
        /* decorators */ undefined,
        /* modifiers */ undefined,
        [index],
        typeArguments[1],
      ),
    ]);
    ts.setEmitFlags(indexSignature, ts.EmitFlags.SingleLine);
    return indexSignature;
  }

  return visit;
};

const accessibilityMask =
  ts.ModifierFlags.Private | ts.ModifierFlags.Protected | ts.ModifierFlags.Public;

function modifiersFromJSDoc(
  methodDeclaration: ts.MethodDeclaration,
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

  return ts.createModifiersFromModifierFlags(modifierFlags);
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
