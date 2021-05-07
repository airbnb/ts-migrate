import ts from 'typescript';
import { Plugin } from 'ts-migrate-server';
import { getReactComponentHeritageType, isReactClassComponent } from './utils/react';
import updateSourceText, { SourceTextUpdate } from '../utils/updateSourceText';
import { createValidate, Properties } from '../utils/validateOptions';

type Options = { force?: boolean };

const optionProperties: Properties = {
  force: { type: 'boolean' },
};

const reactClassLifecycleMethodsPlugin: Plugin<Options> = {
  name: 'react-class-lifecycle-methods',

  run({ fileName, sourceFile, text, options }) {
    return /\.tsx$/.test(fileName)
      ? annotateReactComponentLifecycleMethods(sourceFile, text, options.force)
      : undefined;
  },

  validate: createValidate(optionProperties),
};

export default reactClassLifecycleMethodsPlugin;

enum AnnotationKind {
  Props = 'Props',
  State = 'State',
  Context = 'Context',
}

const reactLifecycleMethodAnnotations: { [method: string]: AnnotationKind[] } = {
  // shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
  shouldComponentUpdate: [AnnotationKind.Props, AnnotationKind.State, AnnotationKind.Context],

  // componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: SS): void;
  componentDidUpdate: [AnnotationKind.Props, AnnotationKind.State],

  // componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
  componentWillReceiveProps: [AnnotationKind.Props, AnnotationKind.Context],

  // componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): void;
  componentWillUpdate: [AnnotationKind.Props, AnnotationKind.State, AnnotationKind.Context],
};

function updateParameterType(parameter: ts.ParameterDeclaration, type: ts.TypeNode | undefined) {
  return ts.factory.updateParameterDeclaration(
    parameter,
    parameter.decorators,
    parameter.modifiers,
    parameter.dotDotDotToken,
    parameter.name,
    parameter.questionToken,
    type,
    parameter.initializer,
  );
}

function annotateReactComponentLifecycleMethods(
  sourceFile: ts.SourceFile,
  sourceText: string,
  force = false,
) {
  const printer = ts.createPrinter();
  const updates: SourceTextUpdate[] = [];

  sourceFile.statements.forEach((statement) => {
    if (ts.isClassDeclaration(statement) && isReactClassComponent(statement)) {
      const heritageType = getReactComponentHeritageType(statement)!;
      const heritageTypeArgs = heritageType.typeArguments || [];
      const propsType =
        heritageTypeArgs[0] || ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      const stateType =
        heritageTypeArgs[1] || ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
      const annotationToType = {
        [AnnotationKind.Props]: propsType,
        [AnnotationKind.State]: stateType,
        [AnnotationKind.Context]: ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
      };

      statement.members.forEach((member) => {
        if (
          ts.isConstructorDeclaration(member) &&
          member.parameters.length === 1 &&
          (member.parameters[0].type == null || force)
        ) {
          const parameter = member.parameters[0];
          const updatedParameter = updateParameterType(parameter, propsType);
          updates.push({
            kind: 'replace',
            index: parameter.pos,
            length: parameter.end - parameter.pos,
            text: printer.printNode(ts.EmitHint.Unspecified, updatedParameter, sourceFile),
          });
        } else if (
          ts.isMethodDeclaration(member) &&
          ts.isIdentifier(member.name) &&
          reactLifecycleMethodAnnotations[member.name.text] != null
        ) {
          const annotations = reactLifecycleMethodAnnotations[member.name.text];

          let didUpdateParameters = false;
          const parametersToPrint: ts.ParameterDeclaration[] = [...member.parameters];

          for (let i = 0; i < member.parameters.length; i += 1) {
            const parameter = member.parameters[i];
            const annotation = annotationToType[annotations[i]];
            if (annotation != null && (parameter.type == null || force)) {
              const updatedParameter = updateParameterType(parameter, annotation);
              parametersToPrint[i] = updatedParameter;
              didUpdateParameters = true;
            }
          }

          if (didUpdateParameters) {
            const start = member.parameters[0].pos;
            const { end } = member.parameters[member.parameters.length - 1];

            let text = printer.printList(
              ts.ListFormat.Parameters,
              ts.factory.createNodeArray(parametersToPrint),
              sourceFile,
            );
            // Remove surrounding parentheses
            text = text.slice(1, text.length - 1);

            updates.push({ kind: 'replace', index: start, length: end - start, text });
          }
        }
      });
    }
  });

  return updateSourceText(sourceText, updates);
}
