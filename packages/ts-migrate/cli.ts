#!/usr/bin/env node

/* eslint-disable no-await-in-loop, no-restricted-syntax */
import path from 'path';
import log from 'updatable-log';
import yargs from 'yargs';

import {
  declareMissingClassPropertiesPlugin,
  eslintFixPlugin,
  explicitAnyPlugin,
  hoistClassStaticsPlugin,
  jsDocPlugin,
  memberAccessibilityPlugin,
  reactClassLifecycleMethodsPlugin,
  reactClassStatePlugin,
  reactDefaultPropsPlugin,
  reactPropsPlugin,
  reactShapePlugin,
  stripTSIgnorePlugin,
  tsIgnorePlugin,
  Plugin,
} from 'ts-migrate-plugins';
import { migrate, MigrateConfig } from 'ts-migrate-server';
import init from './commands/init';
import rename from './commands/rename';

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('npm run ts-migrate --')
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
    'Fix TypeScript errors, using codemods',
    (cmd) =>
      cmd
        .positional('folder', { type: 'string' })
        .choices('defaultAccessibility', ['private', 'protected', 'public'] as const)
        .string('plugin')
        .string('privateRegex')
        .string('protectedRegex')
        .string('publicRegex')
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
          jsDocPlugin,
          memberAccessibilityPlugin,
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
        if (plugin === jsDocPlugin) {
          const anyAlias = args.aliases === 'tsfixme' ? '$TSFixMe' : undefined;
          const typeMap = typeof args.typeMap === 'string' ? JSON.parse(args.typeMap) : undefined;
          config = new MigrateConfig().addPlugin(jsDocPlugin, { anyAlias, typeMap });
        } else {
          config = new MigrateConfig().addPlugin(plugin, {});
        }
      } else {
        const airbnbAnyAlias = '$TSFixMe';
        const airbnbAnyFunctionAlias = '$TSFixMeFunction';
        // by default, we're not going to use any aliases in ts-migrate
        const anyAlias = args.aliases === 'tsfixme' ? airbnbAnyAlias : undefined;
        const anyFunctionAlias = args.aliases === 'tsfixme' ? airbnbAnyFunctionAlias : undefined;
        const useDefaultPropsHelper = args.useDefaultPropsHelper === 'true';

        const { defaultAccessibility, privateRegex, protectedRegex, publicRegex } = args;

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
            useDefaultPropsHelper,
          })
          .addPlugin(reactShapePlugin, {
            anyAlias,
            anyFunctionAlias,
          })
          .addPlugin(declareMissingClassPropertiesPlugin, { anyAlias })
          .addPlugin(memberAccessibilityPlugin, {
            defaultAccessibility,
            privateRegex,
            protectedRegex,
            publicRegex,
          })
          .addPlugin(explicitAnyPlugin, { anyAlias })
          // We need to run eslint-fix before ts-ignore because formatting may affect where
          // the errors are that need to get ignored.
          .addPlugin(eslintFixPlugin, {})
          .addPlugin(tsIgnorePlugin, {})
          // We need to run eslint-fix again after ts-ignore to fix up formatting.
          .addPlugin(eslintFixPlugin, {});
      }

      const exitCode = await migrate({ rootDir, config });

      process.exit(exitCode);
    },
  )
  .command(
    'reignore <folder>',
    'Re-run ts-ignore on a project',
    (cmd) => cmd.positional('folder', { type: 'string' }).require(['folder']),
    async (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);

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

      const exitCode = await migrate({ rootDir, config });

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
  .alias('h', 'help')
  .alias('i', 'init')
  .alias('m', 'migrate')
  .alias('rn', 'rename')
  .alias('ri', 'reignore').argv;
