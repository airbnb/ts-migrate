#!/usr/bin/env node

/* eslint-disable no-await-in-loop, no-restricted-syntax */
import path from 'path';
import log from 'updatable-log';
import yargs from 'yargs';

import {
  addConversionsPlugin,
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

const availablePlugins = [
  addConversionsPlugin,
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
    'rename [options] <folder>',
    'Rename files in folder from JS/JSX to TS/TSX',
    (cmd) =>
      cmd
        .positional('folder', { type: 'string' })
        .string('sources')
        .alias('sources', 's')
        .describe('sources', 'Path to a subset of your project to rename.')
        .example('$0 rename /frontend/foo', 'Rename all the files in /frontend/foo')
        .example(
          '$0 rename /frontend/foo -s "bar/**/*"',
          'Rename all the files in /frontend/foo/bar',
        )
        .require(['folder']),
    (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);
      const { sources } = args;
      const renamedFiles = rename({ rootDir, sources });
      if (renamedFiles === null) {
        process.exit(-1);
      }
    },
  )
  .command(
    'migrate [options] <folder>',
    'Fix TypeScript errors, using codemods',
    (cmd) =>
      cmd
        .positional('folder', { type: 'string' })
        .choices('defaultAccessibility', ['private', 'protected', 'public'] as const)
        .string('plugin')
        .choices(
          'plugin',
          availablePlugins.map((p) => p.name),
        )
        .describe('plugin', 'Run a specific plugin')
        .string('privateRegex')
        .string('protectedRegex')
        .string('publicRegex')
        .string('sources')
        .alias('sources', 's')
        .describe('sources', 'Path to a subset of your project to rename (globs are ok).')
        .example('migrate /frontend/foo', 'Migrate all the files in /frontend/foo')
        .example(
          '$0 migrate /frontend/foo -s "bar/**/*" -s "node_modules/**/*.d.ts"',
          'Migrate all the files in /frontend/foo/bar, accounting for ambient types from node_modules.',
        )
        .example(
          '$0 migrate /frontend/foo --plugin jsdoc',
          'Migrate JSDoc comments for all the files in /frontend/foo',
        )
        .require(['folder']),
    async (args) => {
      const rootDir = path.resolve(process.cwd(), args.folder);
      const { sources } = args;
      let config: MigrateConfig;

      const airbnbAnyAlias = '$TSFixMe';
      const airbnbAnyFunctionAlias = '$TSFixMeFunction';
      // by default, we're not going to use any aliases in ts-migrate
      const anyAlias = args.aliases === 'tsfixme' ? airbnbAnyAlias : undefined;
      const anyFunctionAlias = args.aliases === 'tsfixme' ? airbnbAnyFunctionAlias : undefined;

      if (args.plugin) {
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
          config = new MigrateConfig().addPlugin(plugin, {
            anyAlias,
            anyFunctionAlias,
          });
        }
      } else {
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
          .addPlugin(addConversionsPlugin, { anyAlias })
          // We need to run eslint-fix before ts-ignore because formatting may affect where
          // the errors are that need to get ignored.
          .addPlugin(eslintFixPlugin, {})
          .addPlugin(tsIgnorePlugin, {})
          // We need to run eslint-fix again after ts-ignore to fix up formatting.
          .addPlugin(eslintFixPlugin, {});
      }

      const { exitCode } = await migrate({ rootDir, config, sources });

      process.exit(exitCode);
    },
  )
  .command(
    'reignore <folder>',
    'Re-run ts-ignore on a project',
    (cmd) =>
      cmd
        .option('p', {
          alias: 'messagePrefix',
          default: 'FIXME',
          type: 'string',
          describe:
            'A message to add to the ts-expect-error or ts-ignore comments that are inserted.',
        })
        .positional('folder', { type: 'string' })
        .require(['folder']),
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
        .addPlugin(withChangeTracking(tsIgnorePlugin), {
          messagePrefix: args.messagePrefix,
        })
        .addPlugin(eslintFixChangedPlugin, {});

      const { exitCode } = await migrate({ rootDir, config });

      process.exit(exitCode);
    },
  )
  .example('$0 --help', 'Show help')
  .example('$0 migrate --help', 'Show help for the migrate command')
  .example('$0 init frontend/foo', 'Create tsconfig.json file at frontend/foo/tsconfig.json')
  .example(
    '$0 init:extended frontend/foo',
    'Create extended from the base tsconfig.json file at frontend/foo/tsconfig.json',
  )
  .example('$0 rename frontend/foo', 'Rename files in frontend/foo from JS/JSX to TS/TSX')
  .example(
    '$0 rename frontend/foo --s "bar/baz"',
    'Rename files in frontend/foo/bar/baz from JS/JSX to TS/TSX',
  )
  .demandCommand(1, 'Must provide a command.')
  .help('h')
  .alias('h', 'help')
  .alias('i', 'init')
  .alias('m', 'migrate')
  .alias('rn', 'rename')
  .alias('ri', 'reignore')
  .wrap(Math.min(yargs.terminalWidth(), 100)).argv;
