import ts from 'typescript';
import tsp from 'typescript/lib/protocol';

export type Nullable<T> = T | null | undefined;
export interface PluginParams<TPluginOptions> {
  options: TPluginOptions;
  fileName: string;
  rootDir: string;
  text: string;
  sourceFile: ts.SourceFile;
  getDiagnostics: () => Promise<PluginDiagnostics>;
}

// eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
export type Diagnostic = tsp.Diagnostic | tsp.DiagnosticWithLinePosition;

export interface PluginDiagnostics {
  semanticDiagnostics: Diagnostic[];
  syntacticDiagnostics: Diagnostic[];
  suggestionDiagnostics: Diagnostic[];
}
