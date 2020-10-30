import ts from 'typescript';

export type Nullable<T> = T | null | undefined;
export interface PluginParams<TPluginOptions> {
  options: TPluginOptions;
  fileName: string;
  rootDir: string;
  text: string;
  sourceFile: ts.SourceFile;
  getDiagnostics: () => PluginDiagnostics;
}

export interface PluginDiagnostics {
  semanticDiagnostics: ts.Diagnostic[];
  syntacticDiagnostics: ts.DiagnosticWithLocation[];
  suggestionDiagnostics: ts.DiagnosticWithLocation[];
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
