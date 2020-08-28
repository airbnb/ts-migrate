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
    execSync('npx tsc --init', { cwd: rootDir });
  }

  log.info(`Config file created at ${configFile}`);
}
