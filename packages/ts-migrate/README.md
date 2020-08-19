# ts-migrate

*ts-migrate is a tool for migrating frontend application to TypeScript.*
Run `npx ts-migrate <folder>` to convert your frontend application to TypeScript.

*ts-migrate* is designed around Airbnb projects. Use at your own risk.


# Install

Install [*ts-migrate*](https://www.npmjs.com/package/ts-migrate) using [npm](https://www.npmjs.com):

`npm install --save-dev ts-migrate`

Or [yarn](https://yarnpkg.com):

`yarn add --dev ts-migrate`

# Usage

`npx ts-migrate <folder>`

Or, you can run individual CLI commands:

```
$ npx ts-migrate -- --help

npx script ts-migrate -- <command> [options]

Commands:
  npx ts-migrate -- init <folder>       Initialize tsconfig.json file in <folder>
  npx ts-migrate -- rename <folder>     Rename files in folder from JS/JSX to TS/TSX
  npx ts-migrate -- migrate <folder>    Fix TypeScript errors, using codemods
  npx ts-migrate -- reignore <folder>   Re-run ts-ignore on a project

Options:
  -h,  -- help      Show help
  -i,  -- init      Initialize TypeScript (tsconfig.json) in <folder>
  -m,  -- migrate   Fix TypeScript errors, using codemods
  -rn, -- rename    Rename files in <folder> from JS/JSX to TS/TSX
  -ri, -- reignore  Re-run ts-ignore on a project

Examples:
  npx ts-migrate -- --help                Show help
  npx ts-migrate -- init frontend/foo     Create tsconfig.json file at frontend/foo/tsconfig.json
  npx ts-migrate -- rename frontend/foo   Rename files in frontend/foo from JS/JSX to TS/TSX

```

# Reignore

If you are in a situation where you made some big project-wise changes, update of the common library like TypeScript, React or Redux or improve types for the large codebase. As a result of these operations, you might get quite a few TypeScript compilation errors. There are two ways to proceed:

 1) Fix all the errors (ideal, but time-consuming).
 2) Make the project compilable and fix errors gradually.

For the second option we created a re-ignore script, which will fully automate this step. It will add `any` or `@ts-expect-error` (`@ts-ignores`) comments for all problematic places and will make your project compilable.

Usage: `npx ts-migrate -- reignore`.


# FAQ

> Can it magically figure out all the types?

Unfortunately, no, it is only so smart. It does figure out types from propTypes, but it will fall back to `any` (`$TSFixMe`) for things it can't figure it out.


> I ran ts-migrate on my code and see lots of `@ts-expect-error` (`@ts-ignores`) and `any`. Is that expected?

The ts-migrate codemods are only so smart. So, follow up is required to refine the types and remove the `any` (`$TSFixMe`) and `@ts-expect-error` (`@ts-ignores`). The hope is that it's a nicer starting point than from scratch and that it helps accelerate the TypeScript migration process.


> Um... ts-migrate broke my code! D:

Please file the [issue here](https://github.com/airbnb/ts-migrate/issues/new).


> Can I run ts-migrate on a single specific file within a frontend project?

Unfortunately, you cannot run ts-migrate on a specific file. The easiest way would be to migrate the whole project. If you want, feel free to contribute to this functionality!


> What is `$TSFixMe`?

It's just an alias to `any`: `type $TSFixMe = any;`. We use it at Airbnb for simplifying the migration experience.
We also have the same alias for functions: `type $TSFixMeFunction = (...args: any[]) => any;`.


> How did you use ts-migrate?

It was used a lot at Airbnb codebase! With the help of the ts-migrate we were able to migrate the main part of the entire codebase to the TypeScript. We were able to provide much better starting points in the migration for the huge applications (50k+ lines of codes) and they were migrated in one day!


> Is ts-migrate framework-oriented?

By itself, ts-migrate is not related to any framework. We created a set of plugins, which are related to the React (link to react). So, default configuration(link) contains plugins, which are expecting a react codebase as an input. We didn't test it on any other frameworks or libraries, use at your own risk!


# Contributing

See the [Contributors Guide](https://github.com/airbnb/ts-migrate/blob/master/CONTRIBUTING.md).
