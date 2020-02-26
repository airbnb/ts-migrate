import TSServer from './tsserver/TSServer';
import { CommandTypes } from './tsserver/commands';
import forkTSServer, { forkTSServerWithNoopLogger } from './forkTSServer';
import migrate, { MigrateConfig } from './migrate';
import {
  Plugin as PluginType,
  PluginParams as Params,
  PluginDiagnostics as Diagnostocs,
  Diagnostic as TSDiagnostic,
} from '../types';

export type Plugin<T = {}> = PluginType<T>;
export type PluginParams<TPluginOptions = {}> = Params<TPluginOptions>;
export type PluginDiagnostics = Diagnostocs;
export type Diagnostic = TSDiagnostic;

export { forkTSServer, forkTSServerWithNoopLogger, TSServer, CommandTypes };
export { migrate, MigrateConfig };
