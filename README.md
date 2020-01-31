# ts-migrate

*ts-migrate* is a tool for helping migrate code to TypeScript.
It takes a JavaScript, or a partial TypeScript, project in and gives a compiling TypeScript project out.

*ts-migrate* is intended to accelerate the TypeScript migration process. The resulting code will pass the build, but a followup is required to improve type safety. There will be lots of `// @ts-ignores`, and `any` that will need to be fixed over time. In general, it is a lot nicer than starting from scratch.

*ts-migrate* is designed as a set of plugins so that it can be pretty customizable for different use-cases. Potentially, more plugins can be added for addressing things like improvements of type quality or libraries-related things (like prop-types in React).

Plugins are combined into migration configs. We currently have two main migration configs:

* for the main JavaScript → TypeScript migration
* for the reignore script

These configs can be moved out of the default script, and people can add custom configs with a different set of plugins for their needs.

# Published Packages

| Folder | Version | Changelog | Package |
| ------ | ------- | --------- | ------- |
| [/packages/ts-migrate](./packages/ts-migrate/) | TODO | [changelog](./packages/ts-migrate/CHANGELOG.md) | TODO |
| [/packages/ts-migrate-plugins](./packages/ts-migrate-plugins/) | TODO | [changelog](./packages/ts-migrate-plugins/CHANGELOG.md) | TODO |
| [/packages/ts-migrate-server](./packages/ts-migrate-server/) | TODO | [changelog](./packages/ts-migrate/CHANGELOG.md) | TODO |

# Unpublished Projects

| Folder | Description |
| ------ | -----------|
| [/packages/ts-migrate-example](./packages/ts-migrate-example/) | basic example of usage of the ts-migrate-server with a writing a custom simple plugin |