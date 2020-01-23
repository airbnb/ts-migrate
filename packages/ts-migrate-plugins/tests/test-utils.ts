import log from 'updatable-log';
import ts from 'typescript';
import tsp from 'typescript/lib/protocol';
import { PluginParams, Diagnostic } from '../types';


/* eslint-disable no-console */
export const mockUpdatableLog: () => typeof log = () => ({
  error: (...msg: unknown[]) => {
    console.log('log.error:', ...msg);
  },
  important: (...msg: unknown[]) => {
    console.log('log.important:', ...msg);
  },
  info: (...msg: unknown[]) => {
    console.log('log.info:', ...msg);
  },
  warn: (...msg: unknown[]) => {
    console.log('log.warn:', ...msg);
  },
  update: (...msg: unknown[]) => {
    console.log('log.update:', ...msg);
  },
  clear: () => { },
  quiet: false,
});
/* eslint-enable no-console */

export const noopUpdatableLog: () => typeof log = () => ({
  error: () => { },
  important: () => { },
  info: () => { },
  warn: () => { },
  update: () => { },
  clear: () => { },
  quiet: false,
});

export function mockPluginParams<TOptions = {}>(params: {
  fileName?: string;
  text?: string;
  semanticDiagnostics?: Diagnostic[];
  syntacticDiagnostics?: Diagnostic[];
  suggestionDiagnostics?: Diagnostic[];
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

  return {
    options: (options as unknown) as TOptions,
    fileName,
    rootDir: __dirname,
    text,
    sourceFile: ts.createSourceFile(
      fileName,
      text,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
    ),
    getDiagnostics: async () => ({
      semanticDiagnostics,
      syntacticDiagnostics,
      suggestionDiagnostics,
    }),
  };
}

export function mockDiagnostic(
  text: string,
  errorText: string,
  overrides: Partial<tsp.DiagnosticWithLinePosition> = {},
): tsp.DiagnosticWithLinePosition {
  const index = text.indexOf(errorText);
  if (index === -1) {
    throw new Error(`Did not find ${errorText} in ${text}`);
  }

  const sep = '\n';
  const lines = text.split(sep);

  let i = 0;
  let line = 0;
  while (line < lines.length) {
    const lineLength = lines[line].length + sep.length;
    if (index < i + lineLength) {
      break;
    }

    i += lineLength;
    line += 1;
  }

  let offset = lines[line].indexOf(errorText);

  // line and offset are 1-based
  line += 1;
  offset += 1;

  return {
    message: 'diagnostic message',
    start: index,
    length: errorText.length,
    startLocation: { line, offset },
    endLocation: { line, offset: offset + errorText.length },
    category: 'error',
    code: 123,
    ...overrides,
  };
}
