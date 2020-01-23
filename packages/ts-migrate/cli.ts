/* eslint-disable no-await-in-loop, no-restricted-syntax */
import path from 'path';
import log from 'updatable-log';
import yargs from 'yargs';

import {
  declareMissingClassPropertiesPlugin,
  eslintFixPlugin,
  explicitAnyPlugin,
  hoistClassStaticsPlugin,
  reactClassLifecycleMethodsPlugin,
  reactClassStatePlugin,
  reactDefaultPropsPlugin,
  reactPropsPlugin,
  reactShapePlugin,
  stripTSIgnorePlugin,
  tsIgnorePlugin,
  Plugin,
} from 'ts-migrate-plugins';
import { forkTSServer } from 'ts-migrate-server';
import init from './commands/init';
import migrate, { MigrateConfig } from './commands/migrate';
import rename from './commands/rename';

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('npm run ts-migrate:cli --')
  .version(false)
  .usage('Usage: $0 <command> [options]')
  .command(
    'init <folder>',
    'Initialize tsconfig.json file in <folder>',
    (cmd) => cmd.positional('folder', { type: 'string' }).require(['folder']),
    (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);
      init({ rootDir, isExtendedConfig: false });
    },
  )
  .command(
    'init:extended <folder>',
    'Initialize tsconfig.json file in <folder>',
    (cmd) => cmd.positional('folder', { type: 'string' }).require(['folder']),
    (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);
      init({ rootDir, isExtendedConfig: true });
    },
  )
  .command(
    'rename <folder>',
    'Rename files in folder from JS/JSX to TS/TSX',
    (cmd) => cmd.positional('folder', { type: 'string' }).require(['folder']),
    (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);
      const exitCode = rename({ rootDir });
      process.exit(exitCode);
    },
  )
  .command(
    'migrate <folder>',
    'Fix all TypeScript errors, using codemods',
    (cmd) =>
      cmd
        .positional('folder', { type: 'string' })
        .string('plugin')
        .require(['folder']),
    async (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);
      let config: MigrateConfig;
      if (args.plugin) {
        const availablePlugins = [
          declareMissingClassPropertiesPlugin,
          eslintFixPlugin,
          explicitAnyPlugin,
          hoistClassStaticsPlugin,
          reactClassLifecycleMethodsPlugin,
          reactClassStatePlugin,
          reactDefaultPropsPlugin,
          reactPropsPlugin,
          reactShapePlugin,
          stripTSIgnorePlugin,
          tsIgnorePlugin,
        ];
        const plugin = availablePlugins.find((cur) => cur.name === args.plugin);
        if (!plugin) {
          log.error(`Could not find a plugin named ${args.plugin}.`);
          process.exit(1);
          return;
        }
        config = new MigrateConfig().addPlugin(plugin, {});
      } else {
        const airbnbAnyAlias = '$TSFixMe';
        const airbnbAnyFunctionAlias = '$TSFixMeFunction';
        const anyAlias = args.aliases === 'default' ? undefined : airbnbAnyAlias;
        const anyFunctionAlias = args.aliases === 'default' ? undefined : airbnbAnyFunctionAlias;
        const skipUsingDefaultPropsHelper = args.skipUsingDefaultPropsHelper === 'true';

        config = new MigrateConfig()
          .addPlugin(stripTSIgnorePlugin, {})
          .addPlugin(hoistClassStaticsPlugin, { anyAlias })
          .addPlugin(reactPropsPlugin, {
            anyAlias,
            anyFunctionAlias,
            shouldUpdateAirbnbImports: true,
          })
          .addPlugin(reactClassStatePlugin, { anyAlias })
          .addPlugin(reactClassLifecycleMethodsPlugin, { force: true })
          .addPlugin(reactDefaultPropsPlugin, {
            skipUsingDefaultPropsHelper,
          })
          .addPlugin(reactShapePlugin, {
            anyAlias,
            anyFunctionAlias,
          })
          .addPlugin(declareMissingClassPropertiesPlugin, { anyAlias })
          .addPlugin(explicitAnyPlugin, { anyAlias })
          // We need to run eslint-fix before ts-ignore because formatting may affect where
          // the errors are that need to get ignored.
          .addPlugin(eslintFixPlugin, {})
          .addPlugin(tsIgnorePlugin, {})
          // We need to run eslint-fix again after ts-ignore to fix up formatting.
          .addPlugin(eslintFixPlugin, {});
      }

      const server = forkTSServer();

      process.on('exit', () => {
        server.kill();
      });

      const exitCode = await migrate({ rootDir, config, server });

      server.kill();

      process.exit(exitCode);
    },
  )
  .command(
    'reignore <folder>',
    'Re-run ts-ignore on a project',
    (cmd) => cmd.positional('folder', { type: 'string' }).require(['folder']),
    async (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);
      const server = forkTSServer();

      process.on('exit', () => {
        server.kill();
      });

      const changedFiles = new Map<string, string>();
      function withChangeTracking(plugin: Plugin<unknown>): Plugin<unknown> {
        return {
          name: plugin.name,
          async run(params) {
            const prevText = params.text;
            const nextText = await plugin.run(params);
            const seen = changedFiles.has(params.fileName);
            if (!seen && nextText != null && nextText !== prevText) {
              changedFiles.set(params.fileName, prevText);
            }
            return nextText;
          },
        };
      }
      const eslintFixChangedPlugin: Plugin = {
        name: 'eslint-fix-changed',
        async run(params) {
          if (!changedFiles.has(params.fileName)) return undefined;
          if (changedFiles.get(params.fileName) === params.text) return undefined;
          return eslintFixPlugin.run(params);
        },
      };

      const config = new MigrateConfig()
        .addPlugin(withChangeTracking(stripTSIgnorePlugin), {})
        .addPlugin(withChangeTracking(tsIgnorePlugin), {})
        .addPlugin(eslintFixChangedPlugin, {});

      const exitCode = await migrate({ rootDir, config, server });

      server.kill();

      process.exit(exitCode);
    },
  )
  .example('$0 --help', 'Show help')
  .example('$0 init frontend/foo', 'Create tsconfig.json file at frontend/foo/tsconfig.json')
  .example(
    '$0 init:extended frontend/foo',
    'Create extended from the base tsconfig.json file at frontend/foo/tsconfig.json',
  )
  .example('$0 rename frontend/foo', 'Rename files in frontend/foo from JS/JSX to TS/TSX')
  .demandCommand(1, 'Must provide a command.')
  .help('h')
  .alias('h', 'help').argv;
