import TSServer from './tsserver/TSServer';
import { CommandTypes } from './tsserver/commands';
import forkTSServer, { forkTSServerWithNoopLogger } from './forkTSServer';
import migrate, { MigrateConfig } from './migrate';
import { Plugin as PluginType } from '../types';

export type Plugin<T> = PluginType<T>;

export { forkTSServer, forkTSServerWithNoopLogger, TSServer, CommandTypes };
export { migrate, MigrateConfig };
