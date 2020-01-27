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

export interface PluginDiagnostics {
  semanticDiagnostics: Diagnostic[];
  syntacticDiagnostics: Diagnostic[];
  suggestionDiagnostics: Diagnostic[];
}

export type PluginResult = string | void;

export interface Plugin<TPluginOptions = {}> {
  name: string;
  run(params: PluginParams<TPluginOptions>): Promise<PluginResult> | PluginResult;
}

export type PluginWithOptions<TPluginOptions = {}> = {
  plugin: Plugin<TPluginOptions>;
  options: TPluginOptions;
};

// eslint-disable-next-line no-use-before-define, @typescript-eslint/no-use-before-define
export type Diagnostic = tsp.Diagnostic | tsp.DiagnosticWithLinePosition;
