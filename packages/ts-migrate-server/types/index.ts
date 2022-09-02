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

export interface LintConfig {
  useTabs: boolean;
  tabWidth: number;
}

export interface Plugin<TPluginOptions = unknown> {
  name: string;
  run(
    params: PluginParams<TPluginOptions>,
    lintConfig?: LintConfig,
  ): Promise<PluginResult> | PluginResult;

  /**
   * Returns true if options is a valid options object for this plugin.
   * If options is invalid, it throws a PluginOptionsError.
   *
   * This method should be implemented if TPluginOptions is anything other than unknown.
   */
  validate?(options: unknown): options is TPluginOptions;
}

export type PluginWithOptions<TPluginOptions = unknown> = {
  plugin: Plugin<TPluginOptions>;
  options: TPluginOptions;
};
