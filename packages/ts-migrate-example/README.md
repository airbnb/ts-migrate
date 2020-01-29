# ts-migrate-example

`ts-migrate-example` is a basic example of usage of the [ts-migrate-server](https://github.com/airbnb/ts-migrate/tree/master/packages/ts-migrate-server) with writing a custom plugin.

[Simple plugin](https://github.com/airbnb/ts-migrate/blob/master/packages/ts-migrate-example/src/simplePlugin.ts) is a basic plugin which shows how we can add simple types to the JavaScript code with the usage of [TypeScript compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API).

It takes is the following input:

```
function mult(a, b) {
  return a * b;
}
```

and produces the output:

```
function mult(a:number, b:number):number {
  return a * b;
}
```

You can read about codemodes [here](https://medium.com/@cpojer/effective-javascript-codemods-5a6686bb46fb) and browse [ts-migrate repository](https://github.com/airbnb/ts-migrate) for examples and tests.

# I have an issue, what should I do?

Please file the issue [here](https://github.com/airbnb/ts-migrate/issues/new).

# Contributing

See the Contributors Guide.
