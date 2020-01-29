# ts-migrate-plugins

*ts-migrate-plugins* is designed as a set of plugins, so that it can be pretty customizable for different use-cases.
This package contains a set of [codemodes](https://medium.com/@cpojer/effective-javascript-codemods-5a6686bb46fb) (plugins), which are doing transformation of js/jsx -> ts/tsx.

*ts-migrate-plugins* is designed around Airbnb projects. Use at your own risk.


# Install

Install *ts-migrate* using [npm](https://www.npmjs.com):

`npm install --save-dev ts-migrate-plugins`

Or [yarn](https://yarnpkg.com):

`yarn add --dev ts-migrate-plugins`


# Usage

```
import path from 'path';
import { tsIgnorePlugin } from 'ts-migrate-plugins';
import { forkTSServer, migrate, MigrateConfig } from 'ts-migrate-server';

// get input files folder
const inputDir = path.resolve(__dirname, 'input');

// initialize a typescript server
const server = forkTSServer();
process.on('exit', () => {
  server.kill();
});

// create new migration config and add ts-ignore plugin with empty options
const config = new MigrateConfig().addPlugin(tsIgnorePlugin, {});

// run migration
const exitCode = await migrate({ rootDir: inputDir, config, server });

// kill server
server.kill();
process.exit(exitCode);
```

# List of [plugins](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src)

| Name | Description |
| ---- | ----------- |
| [declare-missing-class-properties](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/declare-missing-class-properties.ts) | Declare missing class properties. |
| [eslint-fix](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/eslint-fix.ts) | Run eslint fix to fix any eslint violations that happened along the way. |
| [explicit-any](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/explicit-any.ts) | Annotate variables with `any` (`$TSFixMe`) in the case of an implicit any violation. |
| [hoist-class-statics](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/hoist-class-statics.ts) | Hoist static class members into the class body (vs. assigning them after the class definition). |
| [react-class-lifecycle-methods](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/react-class-lifecycle-methods.ts) | Annotate React lifecycle method types. |
| [react-class-state](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/react-class-state.ts) | Declare React state type. |
| [react-default-props](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/react-default-props.ts) | Annotate React default props. |
| [react-props](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/react-props.ts) | Convert React prop types to TypeScript type. |
| [react-shape](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/react-shape.ts) | Convert prop types shapes to TypeScript type. |
| [strip-ts-ignore](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/strip-ts-ignore.ts) | Strip `// @ts-ignore`. comments |
| [ts-ignore](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/ts-ignore.ts) | Add `// @ts-ignore` comments for the remaining errors. |


# FAQ

> What is the ts-migrate plugin?

The plugin is an abstraction around codemodes which provides centralized interfaces for the *ts-migrate*. Plugins should implement the following interface:
```
interface Plugin {
  name: string
  run(params: PluginParams<TPluginOptions = {}>): Promise<string | void> | string | void
}

interface PluginParams<TPluginOptions = {}> {
  options: TPluginOptions;
  fileName: string;
  rootDir: string;
  text: string;
  sourceFile: ts.SourceFile;
  getDiagnostics: () => Promise<PluginDiagnostics>;
}

export type Diagnostic = tsp.Diagnostic | tsp.DiagnosticWithLinePosition;

export interface PluginDiagnostics {
  semanticDiagnostics: Diagnostic[];
  syntacticDiagnostics: Diagnostic[];
  suggestionDiagnostics: Diagnostic[];
}
```

> How I can write my own plugin?

You can take a look into the [simple plugin implementation](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-example/src/simplePlugin.ts), the example folder. 
For more examples, please see the plugins implementation for the *ts-migrate*.

> I have an issue with a specific plugin, what should I do?

Please file an [issue here](https://github.com/airbnb/ts-migrate/issues/new).

> Contributing

See the Contributors Guide.
