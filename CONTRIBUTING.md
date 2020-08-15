## Overview

[Yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/) are used to manage dependencies and
build config across package and
[lerna](https://github.com/lerna/lerna/) is used to manage versioning.

## Project structure

```
ts-migrate/
  lerna.json
  package.json
  packages/
    ts-migrate/
      tests/
      build/
      package.json
      ...
    ts-migrate-server/
    ts-migrate-plugins/
    ts-migrate-example
```

## Local development

Run the following to setup your local dev environment:

```sh
# Install `yarn`, alternatives at https://yarnpkg.com/en/docs/install
brew install yarn

# Clone or fork `ts-migrate`
git clone git@github.com:airbnb/ts-migrate.git # or your fork
cd ts-migrate

# install dependencies
yarn

# build packages
yarn build

# test packages
yarn test

# lint packages
yarn lint
```