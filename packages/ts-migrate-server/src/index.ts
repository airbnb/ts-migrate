import migrate, { MigrateConfig } from './migrate';
import {
  Plugin as PluginType,
  PluginParams as Params,
  PluginDiagnostics as Diagnostocs,
} from '../types';

export type Plugin<T = {}> = PluginType<T>;
export type PluginParams<TPluginOptions = {}> = Params<TPluginOptions>;
export type PluginDiagnostics = Diagnostocs;

export { migrate, MigrateConfig };
