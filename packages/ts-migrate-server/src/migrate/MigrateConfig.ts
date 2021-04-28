import { Plugin } from '../../types';

type InferOptions<P> = P extends Plugin<infer O> ? O : never;

export default class MigrateConfig {
  plugins: { plugin: Plugin<unknown>; options: unknown }[] = [];

  addPlugin<P extends Plugin<unknown>>(plugin: P, options: InferOptions<P>): this {
    this.plugins.push({ plugin, options });
    return this;
  }
}
