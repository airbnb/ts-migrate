import fs from 'fs';
import log from 'updatable-log';
import { MigrateConfig } from 'ts-migrate-server';

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
} from 'ts-migrate-plugins';

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

interface MigrateConfigJson {
  globalOptions?: Record<string, unknown>;
  plugins: PluginConfigJson[];
}

interface PluginConfigJson {
  name: string;
  options?: Record<string, unknown>;
}

function migrateConfigFromJson(json: MigrateConfigJson): MigrateConfig {
  const config = new MigrateConfig();
  json.plugins.forEach((pluginJson) => {
    const plugin = availablePlugins.find((cur) => cur.name === pluginJson.name);
    if (!plugin) {
      log.error(`Could not find a plugin named ${pluginJson.name}.`);
      process.exit(1);
    }
    config.addPlugin(plugin, { ...json.globalOptions, ...pluginJson.options });
  });
  return config;
}

export function migrateConfigFromFile(path: string): MigrateConfig {
  return migrateConfigFromJson(JSON.parse(fs.readFileSync(path).toString()));
}

interface Args {
  aliases?: string;
  defaultAccessibility?: 'private' | 'protected' | 'public';
  privateRegex?: string;
  protectedRegex?: string;
  publicRegex?: string;
  typeMap?: string;
  useDefaultPropsHelper?: string;
}

export function singlePluginConfig(pluginName: string, args: Args): MigrateConfig {
  return migrateConfigFromJson({
    globalOptions: {
      anyAlias: args.aliases === 'tsfixme' ? '$TSFixMe' : undefined,
    },
    plugins: [
      {
        name: pluginName,
        options: {
          typeMap: pluginName === 'jsdoc' && args.typeMap ? JSON.parse(args.typeMap) : undefined,
        },
      },
    ],
  });
}

export function defaultMigrateConfig(args: Args): MigrateConfig {
  const airbnbAnyAlias = '$TSFixMe';
  const airbnbAnyFunctionAlias = '$TSFixMeFunction';
  // by default, we're not going to use any aliases in ts-migrate
  const anyAlias = args.aliases === 'tsfixme' ? airbnbAnyAlias : undefined;
  const anyFunctionAlias = args.aliases === 'tsfixme' ? airbnbAnyFunctionAlias : undefined;
  const useDefaultPropsHelper = args.useDefaultPropsHelper === 'true';

  const { defaultAccessibility, privateRegex, protectedRegex, publicRegex } = args;

  return (
    new MigrateConfig()
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
      .addPlugin(eslintFixPlugin, {})
  );
}
