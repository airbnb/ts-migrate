# ts-migrate-plugins

*ts-migrate-plugins* is designed as a set of plugins, so that it can be pretty customizable for different use-cases.
This package contains a set of [codemods](https://medium.com/@cpojer/effective-javascript-codemods-5a6686bb46fb) (plugins), which are doing transformation of js/jsx -> ts/tsx.

*ts-migrate-plugins* is designed around Airbnb projects. Use at your own risk.


# Install

Install *ts-migrate* using [npm](https://www.npmjs.com):

`npm install --save-dev ts-migrate-plugins`

Or [yarn](https://yarnpkg.com):

`yarn add --dev ts-migrate-plugins`


# Usage

```typescript
import path from 'path';
import { tsIgnorePlugin } from 'ts-migrate-plugins';
import { migrate, MigrateConfig } from 'ts-migrate-server';

// get input files folder
const inputDir = path.resolve(__dirname, 'input');

// create new migration config and add ts-ignore plugin with empty options
const config = new MigrateConfig().addPlugin(tsIgnorePlugin, {});

// run migration
const exitCode = await migrate({ rootDir: inputDir, config });

process.exit(exitCode);
```

# List of [plugins](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src)

| Name | Description |
| ---- | ----------- |
| [add-conversions](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/add-conversions.ts) | Add conversions to `any` (`$TSFixMe`) in the case of type errors. |
| [declare-missing-class-properties](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/declare-missing-class-properties.ts) | Declare missing class properties. |
| [eslint-fix](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/eslint-fix.ts) | Run eslint fix to fix any eslint violations that happened along the way. |
| [explicit-any](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/explicit-any.ts) | Annotate variables with `any` (`$TSFixMe`) in the case of an implicit any violation. |
| [hoist-class-statics](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/hoist-class-statics.ts) | Hoist static class members into the class body (vs. assigning them after the class definition). |
| [jsdoc](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/jsdoc.ts) | Convert JSDoc @param types to TypeScript annotations. |
| [member-accessibility](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/member-accessibility.ts) | Add accessibility modifiers (private, protected, or public) to class members according to naming conventions. |
| [react-class-lifecycle-methods](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/react-class-lifecycle-methods.ts) | Annotate React lifecycle method types. |
| [react-class-state](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/react-class-state.ts) | Declare React state type. |
| [react-default-props](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/react-default-props.ts) | Annotate React default props. |
| [react-props](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/react-props.ts) | Convert React prop types to TypeScript type. |
| [react-shape](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/react-shape.ts) | Convert prop types shapes to TypeScript type. |
| [strip-ts-ignore](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/strip-ts-ignore.ts) | Strip `// @ts-ignore`. comments |
| [ts-ignore](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/plugins/ts-ignore.ts) | Add `// @ts-ignore` comments for the remaining errors. |


# Type of plugins

We have three main categories of plugins:

- Text based plugins. Plugins of this category are operating with a text of source files and operate based on this.  Example: [example-plugin-text](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-example/src/example-plugin-text.ts).

- Jscodeshift based plugins. These plugins are using a [jscodeshift toolkit](https://github.com/facebook/jscodeshift) as a base for operations and transformations around Abstract Syntax Tree. Example: [example-plugin-jscodeshift](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-example/src/example-plugin-jscodeshift.ts).

- TypeScript ast-based plugins. The main idea behind these plugins is by parsing Abstract Syntax Tree with [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API), we can generate an array of updates for the text and apply them to the source file. Example: [example-plugin-ts](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-example/src/example-plugin-ts.ts).


# FAQ

> What is the ts-migrate plugin?

The plugin is an abstraction around codemods which provides centralized interfaces for the *ts-migrate*. Plugins should implement the following interface:

```typescript
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
  getLanguageService: () => ts.LanguageService;
}
```


> How I can write my own plugin?

You can take a look into the [plugin examples](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-example/src).
For more information, please check the [plugins implementation](https://github.com/airbnb/ts-migrate/tree/master/packages/ts-migrate-plugins/src/plugins) for the *ts-migrate*.


> I have an issue with a specific plugin, what should I do?

Please file an [issue here](https://github.com/airbnb/ts-migrate/issues/new).


# Contributing

See the [Contributors Guide](https://github.com/airbnb/ts-migrate/blob/master/CONTRIBUTING.md).
