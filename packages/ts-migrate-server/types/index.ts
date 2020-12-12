import ts from 'typescript';

export type Nullable<T> = T | null | undefined;
export interface PluginParams<TPluginOptions> {
  options: TPluginOptions;
  fileName: string;
  rootDir: string;
  text: string;
  sourceFile: ts.SourceFile;
  getLanguageService: () => ts.LanguageService;
}

export type PluginResult = string | void;

export interface Plugin<TPluginOptions = unknown> {
  name: string;
  run(params: PluginParams<TPluginOptions>): Promise<PluginResult> | PluginResult;
}

export type PluginWithOptions<TPluginOptions = unknown> = {
  plugin: Plugin<TPluginOptions>;
  options: TPluginOptions;
};
