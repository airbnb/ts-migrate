# ts-migrate-server

`ts-migrate-server` is a package that contains the main migration runner and the spawns a TSServer process.
`ts-migrate-server` is designed around Airbnb projects. Use at your own risk.

# Install

Install *ts-migrate-server* using [npm](https://www.npmjs.com):

`npm install --save-dev ts-migrate-server`

Or [yarn](https://yarnpkg.com):

`yarn add --dev ts-migrate-server`
 

# Usage

```typescript
import path from 'path';
import { forkTSServer, migrate, MigrateConfig } from 'ts-migrate-server';

// get input files folder
const inputDir = path.resolve(__dirname, 'input');

// initialize typescript server
const server = forkTSServer();
process.on('exit', () => {
  server.kill();
});

// create new migration config. You can add your plugins there
const config = new MigrateConfig();

// run migration
const exitCode = await migrate({ rootDir: inputDir, config, server });

// kill server
server.kill();
process.exit(exitCode);
```

# FAQ

> How can I use *ts-migrate-server*?

You can take a look at [basic usage example](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-example/src/index.ts#L2). 
Another resource would be [source code](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate/cli.ts) of the *ts-migrate* cli.

> Why not just use codemods?

You actually can use [codemods](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-plugins/src/declare-missing-class-properties.ts) in your plugins! 
*ts-migrate-server* provides more standartalized API around TypeScript compiler usage and allows us to use the benefits of the TypeScript Server protocol.

> I have an issue with a specific plugin, what should I do?

Please file an [issue here](https://github.com/airbnb/ts-migrate/issues/new).

# Contributing

See the Contributors Guide.
