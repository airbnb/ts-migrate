import migrate, { MigrateConfig } from './migrate';
import PluginOptionsError from './utils/PluginOptionsError';
import { Plugin as PluginType, PluginParams as Params } from '../types';

export type Plugin<T = unknown> = PluginType<T>;
export type PluginParams<TPluginOptions = unknown> = Params<TPluginOptions>;

export { migrate, MigrateConfig, PluginOptionsError };
