# ts-migrate

*ts-migrate* is a tool for helping migrate code to TypeScript.
It takes a JavaScript, or a partial TypeScript, project in and gives a compiling TypeScript project out.

*ts-migrate* is intended to accelerate the TypeScript migration process. The resulting code will pass the build, but a followup is required to improve type safety. There will be lots of `// @ts-expect-error`, and `any` that will need to be fixed over time. In general, it is a lot nicer than starting from scratch.

*ts-migrate* is designed as a set of plugins so that it can be pretty customizable for different use-cases. Potentially, more plugins can be added for addressing things like improvements of type quality or libraries-related things (like prop-types in React).

Plugins are combined into migration configs. We currently have two main migration configs:

* for the main JavaScript → TypeScript migration
* for the reignore script

These configs can be moved out of the default script, and people can add custom configs with a different set of plugins for their needs.

You can find instructions on how to install and run ts-migrate in the [main package](./packages/ts-migrate/). If you find any [issues](https://github.com/airbnb/ts-migrate/issues) or have ideas for improvements, we welcome your [contributions](https://github.com/airbnb/ts-migrate/blob/master/CONTRIBUTING.md)!

Check out the [blog post](https://medium.com/airbnb-engineering/ts-migrate-a-tool-for-migrating-to-typescript-at-scale-cd23bfeb5cc) about ts-migrate!


# Published Packages

| Folder | Version | Package |
| ------ | ------- | ------- |
| [packages/ts-migrate](./packages/ts-migrate/) | [![npm version](https://badge.fury.io/js/ts-migrate.svg)](https://badge.fury.io/js/ts-migrate) | [ts-migrate](https://www.npmjs.com/package/ts-migrate) |
| [packages/ts-migrate-plugins](./packages/ts-migrate-plugins/) | [![npm version](https://badge.fury.io/js/ts-migrate-plugins.svg)](https://badge.fury.io/js/ts-migrate-plugins) | [ts-migrate-plugins](https://www.npmjs.com/package/ts-migrate-plugins) |
| [packages/ts-migrate-server](./packages/ts-migrate-server/) | [![npm version](https://badge.fury.io/js/ts-migrate-server.svg)](https://badge.fury.io/js/ts-migrate-server) | [ts-migrate-server](https://www.npmjs.com/package/ts-migrate-server) |

# Unpublished Packages

| Folder | Description |
| ------ | -----------|
| [packages/ts-migrate-example](./packages/ts-migrate-example/) | basic example of usage of the ts-migrate-server with a writing a custom simple plugin |


# Authors

<table>
  <tbody>
    <tr>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/brieb.png?s=150">
        <br>
        <a href="https://github.com/brieb">Brie Bunge</a>
      </td>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/Rudeg.png?s=150">
        <br>
        <a href="https://github.com/Rudeg">Sergii Rudenko</a>
      </td>
      <td align="center" width="20%" valign="top">
        <img width="100" height="100" src="https://github.com/jjjjhhhhhh.png?s=150">
        <br>
        <a href="https://github.com/jjjjhhhhhh">John Haytko</a>
      </td>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/elliotsa.png?s=150">
        <br>
        <a href="https://github.com/elliotsa">Elliot Sachs</a>
      </td>
      <td align="center" valign="top">
        <img width="100" height="100" src="https://github.com/lencioni.png?s=150">
        <br>
        <a href="https://github.com/lencioni">Joe Lencioni</a>
     </tr>
  </tbody>
</table>


# License

MIT, see [LICENSE](https://github.com/airbnb/ts-migrate/blob/master/LICENCE) for details.
