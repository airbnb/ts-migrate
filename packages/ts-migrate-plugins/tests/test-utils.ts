import ts from 'typescript';
import { PluginParams } from 'ts-migrate-server';

type WithoutFile<T> = Omit<T, 'file'>;

export function mockPluginParams<TOptions = unknown>(params: {
  fileName?: string;
  text?: string;
  semanticDiagnostics?: WithoutFile<ts.Diagnostic>[];
  syntacticDiagnostics?: WithoutFile<ts.DiagnosticWithLocation>[];
  suggestionDiagnostics?: WithoutFile<ts.DiagnosticWithLocation>[];
  options?: TOptions;
}): PluginParams<TOptions> {
  const {
    fileName = 'file.ts',
    text = '',
    semanticDiagnostics = [],
    syntacticDiagnostics = [],
    suggestionDiagnostics = [],
    options = {},
  } = params;

  const sourceFile = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );

  const withFile = <T>(diagnostic: T): T & { file: ts.SourceFile } => ({
    ...diagnostic,
    file: sourceFile,
  });

  return {
    options: (options as unknown) as TOptions,
    fileName,
    rootDir: __dirname,
    text,
    sourceFile,
    getDiagnostics: () => ({
      semanticDiagnostics: semanticDiagnostics.map(withFile),
      syntacticDiagnostics: syntacticDiagnostics.map(withFile),
      suggestionDiagnostics: suggestionDiagnostics.map(withFile),
    }),
  };
}

export function mockDiagnostic(
  text: string,
  errorText: string,
  overrides: Partial<ts.DiagnosticWithLocation> = {},
): WithoutFile<ts.DiagnosticWithLocation> {
  const index = text.indexOf(errorText);
  if (index === -1) {
    throw new Error(`Did not find ${errorText} in ${text}`);
  }

  return {
    messageText: 'diagnostic message',
    start: index,
    length: errorText.length,
    category: ts.DiagnosticCategory.Error,
    code: 123,
    ...overrides,
  };
}
