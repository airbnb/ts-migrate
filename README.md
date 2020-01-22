# ts-migrate

*ts-migrate is a tool for migrating frontend application to TypeScript.*
Run `npm run ts-migrate <folder>` to convert your frontend application to TypeScript.

# Install

Install ts-migrate using [npm](https://www.npmjs.com):

`npm install --save-dev ts-migrate`

Or [yarn](https://yarnpkg.com):

`yarn add --dev ts-migrate`

# Usage

`npm run ts-migrate frontend/YOUR_FOLDER_HERE`

Or, you can run individual CLI commands:

```npm run ts-migrate:cli -- --help

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

Please feel the [issue](https://github.com/airbnb/ts-migrate/issues/new).


> Can I run ts-migrate on a single specific file within a frontend project or application?

Unfortunately, you cannot run ts-migrate only on a specific file. The easiest way would be to migrating the whole project. If you want, feel free to contribute to this functionality!

	
> What is `$TSFixMe`?

It's just an alias to `any`: `type $TSFixMe = any;`. We use it at Airbnb for the simplifying migration experience.
We also have the same alias for the functions: `type $TSFixMeFunction = (...args: any[]) => any;`.


# Contributing
See the Contributors Guide
