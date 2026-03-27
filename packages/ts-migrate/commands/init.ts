import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import log from 'updatable-log';

interface InitParams {
  rootDir: string;
  isExtendedConfig: boolean;
}

const defaultConfig = `{
  "extends": "../typescript/tsconfig.base.json",
  "include": [".", "../typescript/types"]
}
`;

export default function init({ rootDir, isExtendedConfig = false }: InitParams) {
  if (!fs.existsSync(rootDir)) {
    log.error(`${rootDir} does not exist`);
    return;
  }

  const configFile = path.resolve(rootDir, 'tsconfig.json');
  if (fs.existsSync(configFile)) {
    log.info(`Config file already exists at ${configFile}`);
    return;
  }

  if (isExtendedConfig) {
    fs.writeFileSync(configFile, defaultConfig);
  } else {
    try {
      execSync('npx tsc --init', { cwd: rootDir });
    } catch (err) {
      log.error(
        'Failed to run `npx tsc --init`. Please make sure TypeScript is installed:\n' +
        '  npm install -g typescript\n' +
        'or install it locally in your project:\n' +
        '  npm install --save-dev typescript',
      );
      return;
    }
  }

  if (!fs.existsSync(configFile)) {
    log.error(
      `tsconfig.json was not created at ${configFile}. ` +
      'Please make sure TypeScript is installed and `tsc` is available.',
    );
    return;
  }

  log.info(`Config file created at ${configFile}`);
}
