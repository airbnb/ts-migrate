import jscodeshift, { Identifier, TSTypeAnnotation } from 'jscodeshift';
import { Collection } from 'jscodeshift/src/Collection';
import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import { isDiagnosticWithLinePosition } from '../utils/type-guards';
import { AnyAliasOptions, validateAnyAliasOptions } from '../utils/validateOptions';

type Options = AnyAliasOptions;

export interface LintConfig {
  useTabs: boolean;
  tabWidth: number;
}

const explicitAnyPlugin: Plugin<Options> = {
  name: 'explicit-any',

  run({ options, fileName, text, getLanguageService }, lintConfig?: LintConfig) {
    const semanticDiagnostics = getLanguageService().getSemanticDiagnostics(fileName);
    const diagnostics = semanticDiagnostics
      .filter(isDiagnosticWithLinePosition)
      .filter((d) => d.category === ts.DiagnosticCategory.Error);
    return withExplicitAny(text, diagnostics, options.anyAlias, lintConfig);
  },

  validate: validateAnyAliasOptions,
};

export default explicitAnyPlugin;

const j = jscodeshift.withParser('tsx');

function withExplicitAny(
  text: string,
  diagnostics: ts.DiagnosticWithLocation[],
  anyAlias?: string,
  lintConfig?: any,
): string {
  const root = j(text, lintConfig);

  const anyType = anyAlias != null ? j.tsTypeReference(j.identifier(anyAlias)) : j.tsAnyKeyword();
  const typeAnnotation = j.tsTypeAnnotation(anyType);
  replaceTS2683(
    root,
    diagnostics.filter((diagnostic) => diagnostic.code === 2683),
    typeAnnotation,
  );
  replaceTS7006AndTS7008(
    root,
    diagnostics.filter((diagnostic) => diagnostic.code === 7006 || diagnostic.code === 7008),
    typeAnnotation,
  );
  replaceTS7019(
    root,
    diagnostics.filter((diagnostic) => diagnostic.code === 7019),
    j.tsTypeAnnotation(j.tsArrayType(anyType)),
  );
  replaceTS7031(
    root,
    diagnostics.filter((diagnostic) => diagnostic.code === 7031),
    typeAnnotation,
  );
  replaceTS7034(
    root,
    diagnostics.filter((diagnostic) => diagnostic.code === 7034),
    typeAnnotation,
  );
  replaceTS2459(
    root,
    diagnostics.filter((diagnostic) => diagnostic.code === 2459),
    typeAnnotation,
  );
  replaceTS2525(
    root,
    diagnostics.filter((diagnostic) => diagnostic.code === 2525),
    typeAnnotation,
  );
  return root.toSource(lintConfig);
}

// TS2683: "'this' implicitly has type 'any' because it does not have a type annotation."
function replaceTS2683(
  root: Collection<any>,
  diagnostics: ts.DiagnosticWithLocation[],
  typeAnnotation: TSTypeAnnotation,
) {
  const annotated = new Set();

  diagnostics.forEach((diagnostic) => {
    root
      .find(
        j.ThisExpression,
        (node: any) =>
          node.start === diagnostic.start && node.end === diagnostic.start + diagnostic.length,
      )
      .forEach((path) => {
        let newNode = path.parentPath;
        // Find the containing function declaration/expression.
        while (
          newNode.parentPath &&
          !j.FunctionDeclaration.check(newNode.node) &&
          !j.FunctionExpression.check(newNode.node)
        ) {
          newNode = newNode.parentPath;
        }

        // Add annotation only if we haven't already added one to this function.
        if (!annotated.has(newNode)) {
          newNode.get('params').unshift(j.identifier.from({ name: 'this', typeAnnotation }));
          annotated.add(newNode);
        }
      });
  });
}

// TS7006: "Parameter '{0}' implicitly has an '{1}' type."
// TS7008: "Member '{0}' implicitly has an '{1}' type."
function replaceTS7006AndTS7008(
  root: Collection<any>,
  diagnostics: ts.DiagnosticWithLocation[],
  typeAnnotation: TSTypeAnnotation,
) {
  diagnostics.forEach((diagnostic) => {
    root
      .find(
        j.Identifier,
        (node: any) =>
          node.start === diagnostic.start &&
          node.end === diagnostic.start + diagnostic.length &&
          node.typeAnnotation == null,
      )
      .forEach((path) => {
        let replaceArrow = false;

        const parentNode = path.parent.node;
        if (j.ArrowFunctionExpression.check(parentNode)) {
          // Special casing to work around jscodeshift bugs.
          let { body, params } = parentNode;

          // Object literals used as arrow function returns do not have
          // parentheses added.
          // https://github.com/benjamn/recast/issues/743
          if (j.ObjectExpression.check(body)) {
            replaceArrow = true;
            body = j.objectExpression.from({ ...body });
          }

          // Make sure to add parentheses around single parameters.
          if (params.length === 1) {
            replaceArrow = true;
            params = [
              j.identifier.from({
                ...(parentNode.params[0] as Identifier),
                typeAnnotation,
              }),
            ];
          }

          if (replaceArrow) {
            path.parent.replace(
              j.arrowFunctionExpression.from({
                ...parentNode,
                params,
                body,
              }),
            );
          }
        }

        if (!replaceArrow) {
          path.get('typeAnnotation').replace(typeAnnotation);
        }
      });
  });
}

// TS7019: "Rest parameter '{0}' implicitly has an 'any[]' type."
function replaceTS7019(
  root: Collection<any>,
  diagnostics: ts.DiagnosticWithLocation[],
  typeAnnotation: TSTypeAnnotation,
) {
  diagnostics.forEach((diagnostic) => {
    root
      .find(
        j.RestElement,
        (node: any) =>
          node.start === diagnostic.start &&
          node.end === diagnostic.start + diagnostic.length &&
          node.typeAnnotation == null,
      )
      .forEach((path) => {
        path.get('typeAnnotation').replace(typeAnnotation);
      });
  });
}

// TS7031: "Binding element '{0}' implicitly has an '{1}' type."
function replaceTS7031(
  root: Collection<any>,
  diagnostics: ts.DiagnosticWithLocation[],
  typeAnnotation: TSTypeAnnotation,
) {
  const getParentObjectPattern = (path: any) => {
    let res = path;
    while (
      res.parent &&
      j.ObjectProperty.check(res.parent.value) &&
      res.parent.parent &&
      j.ObjectPattern.check(res.parent.parent.value)
    ) {
      res = res.parent.parent;
    }
    return res;
  };

  diagnostics.forEach((diagnostic) => {
    root.find(j.ObjectPattern).forEach((path) => {
      if (path.node.typeAnnotation == null) {
        const propertyIndex = path.node.properties.findIndex(
          (property: any) =>
            property.start === diagnostic.start &&
            property.end === diagnostic.start + diagnostic.length &&
            j.ObjectProperty.check(property),
        );
        if (propertyIndex !== -1) {
          const objectPattern = getParentObjectPattern(path);
          if (objectPattern.node.typeAnnotation == null) {
            objectPattern.get('typeAnnotation').replace(typeAnnotation);
          }
        }
      }
    });
  });
}

// TS7034: Variable '{0}' implicitly has type '{1}' in some locations where its type cannot be determined.
function replaceTS7034(
  root: Collection<any>,
  diagnostics: ts.DiagnosticWithLocation[],
  typeAnnotation: TSTypeAnnotation,
) {
  diagnostics.forEach((diagnostic) => {
    root
      .find(j.Identifier)
      .filter(
        (path: any) =>
          path.node.start === diagnostic.start &&
          path.node.end === diagnostic.start + diagnostic.length &&
          path.node.typeAnnotation == null,
      )
      .forEach((path) => {
        if (
          !j.ImportSpecifier.check(path.parent.node) &&
          !j.ImportDefaultSpecifier.check(path.parent.node) &&
          !j.ImportNamespaceSpecifier.check(path.parent.node)
        ) {
          path.get('typeAnnotation').replace(typeAnnotation);
        }
      });
  });
}

// TS2459: Type '{0}' has no property '{1}' and no string index signature.
function replaceTS2459(
  root: Collection<any>,
  diagnostics: ts.DiagnosticWithLocation[],
  typeAnnotation: TSTypeAnnotation,
) {
  diagnostics.forEach((diagnostic) => {
    root
      .find(j.Identifier)
      .filter(
        (path: any) =>
          path.node.start === diagnostic.start &&
          path.node.end === diagnostic.start + diagnostic.length &&
          path.node.typeAnnotation == null,
      )
      .forEach((path) => {
        let newNode = path.parentPath;
        // The error will only provide the location of the left hand side identifier
        // so we have to find the variable declarator by traveling back up
        while (newNode.parentPath && !j.VariableDeclarator.check(newNode.node)) {
          newNode = newNode.parentPath;
        }
        if (newNode.get('init')) {
          // init returns the right hand side identifier
          const rightHandSideNodePath = newNode.get('init');
          const name = rightHandSideNodePath.getValueProperty('name');
          let { scope } = rightHandSideNodePath;
          // we check if the current scope declares the identifier
          // if not we move up to the parent scope
          while (scope && scope.parent && !scope.declares(name)) {
            scope = scope.parent;
          }
          if (scope && scope.getBindings()[name]) {
            const binding = scope.getBindings()[name][0];
            if (
              j.AssignmentPattern.check(binding.parentPath.node) &&
              j.ObjectExpression.check(binding.parentPath.node.right) &&
              binding.parentPath.node.right.properties.length === 0 &&
              binding.node.typeAnnotation == null
            ) {
              binding.get('typeAnnotation').replace(typeAnnotation);
            }
          }
        }
      });
  });
}

// TS2525: Initializer provides no value for this binding element and the binding element has no default value.
function replaceTS2525(
  root: Collection<any>,
  diagnostics: ts.DiagnosticWithLocation[],
  typeAnnotation: TSTypeAnnotation,
) {
  diagnostics.forEach((diagnostic) => {
    root
      .find(j.Identifier)
      .filter(
        (path: any) =>
          path.node.start === diagnostic.start &&
          path.node.end === diagnostic.start + diagnostic.length &&
          path.node.typeAnnotation == null,
      )
      .forEach((path) => {
        const potentialObjDestructionNode = path.parentPath.parentPath.parentPath;
        if (
          j.ObjectPattern.check(potentialObjDestructionNode.node) &&
          (j.AssignmentPattern.check(potentialObjDestructionNode.parentPath.node) ||
            j.VariableDeclarator.check(potentialObjDestructionNode.parentPath.node)) &&
          // to prevent adding a type to the obj destruction inside of the destruction
          !j.ObjectProperty.check(potentialObjDestructionNode.parentPath.parentPath.node) &&
          potentialObjDestructionNode.node.typeAnnotation == null
        ) {
          potentialObjDestructionNode.get('typeAnnotation').replace(typeAnnotation);
        }
      });
  });
}
