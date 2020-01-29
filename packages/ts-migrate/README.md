# ts-migrate

*ts-migrate is a tool for migrating frontend application to TypeScript.*
Run `npm run ts-migrate <folder>` to convert your frontend application to TypeScript.

*ts-migrate* is designed around Airbnb projects. Use at your own risk.


# Install

Install *ts-migrate* using [npm](https://www.npmjs.com):

`npm install --save-dev ts-migrate`

Or [yarn](https://yarnpkg.com):

`yarn add --dev ts-migrate`

# Usage

`npm run ts-migrate <folder>`

Or, you can run individual CLI commands:

```
$ npm run ts-migrate:cli -- --help

npm run script ts-migrate:cli -- <command> [options]

Commands:
  npm run script ts-migrate:cli -- init     Initialize tsconfig.json file in
  <folder>                                  <folder>
  npm run script ts-migrate:cli -- rename   Rename files in folder from JS/JSX
  <folder>                                  to TS/TSX
  npm run script ts-migrate:cli -- migrate  Fix all TypeScript errors, using
  <folder>                                  codemods
  npm run script ts-migrate:cli --          Re-run ts-ignore on a project
  reignore <folder>

Options:
  -h,  --help      Show help                                            
  -i,  --init      Initialize TypeScript (tsconfig.json) in <folder>
  -m,  --migrate   Fix all TypeScript errors, using codemods
  -rn, --rename    Rename files in <folder> from JS/JSX to TS/TSX
  -ri, --reignore  Re-run ts-ignore on a project

Examples:
  npm run script ts-migrate:cli -- --help   Show help
  npm run script ts-migrate:cli -- init     Create tsconfig.json file at
  frontend/foo                              frontend/foo/tsconfig.json
  npm run script ts-migrate:cli -- rename   Rename files in frontend/foo from
  frontend/foo                              JS/JSX to TS/TSX
```

# FAQ

> Can it magically figure out all the types?

Unfortunately, no, it is only so smart. It does figure out types from propTypes, but it will fall back to `any` (`$TSFixMe`) for things it can't figure it out.


> I ran ts-migrate on my code and see lots of `@ts-ignores` and `any`. Is that expected?

The ts-migrate codemods are only so smart. So, follow up is required to refine the types and remove the `any` (`$TSFixMe`) and `@ts-ignore`. The hope is that it's a nicer starting point than from scratch and that it helps accelerate the TypeScript migration process.


> Um... ts-migrate broke my code! D:

Please file the [issue here](https://github.com/airbnb/ts-migrate/issues/new).


> Can I run ts-migrate on a single specific file within a frontend project?

Unfortunately, you cannot run ts-migrate on a specific file. The easiest way would be to migrate the whole project. If you want, feel free to contribute to this functionality!


> What is `$TSFixMe`?

It's just an alias to `any`: `type $TSFixMe = any;`. We use it at Airbnb for simplifying the migration experience.
We also have the same alias for functions: `type $TSFixMeFunction = (...args: any[]) => any;`.


> How did you use to-migrate?

It was used a lot at Airbnb codebase! With the help of the ts-migrate we were able to migrate the main part of the entire codebase to the TypeScript. We were able to provide much better starting points in the migration for the huge applications (50k+ lines of codes) and they were migrated in one day!


> Is ts-migrate framework-oriented?

By itself, ts-migrate is not related to any framework. We created a set of plugins, which are related to the React (link to react). So, default configuration(link) contains plugins, which are expecting a react codebase as an input. We didn't test it on any other frameworks or libraries, use at your own risk!


# Contributing

See the Contributors Guide.
