import path from 'path';
import fs from 'fs';
import { TSServer, forkTSServerWithNoopLogger } from '../../../src';
import { createDir, copyDir, deleteDir, getDirData } from '../../test-utils';
import migrate, { MigrateConfig } from '../../../src/migrate';

jest.mock('updatable-log', () => {
  // eslint-disable-next-line global-require
  const { mockUpdatableLog } = require('../../test-utils');
  return mockUpdatableLog();
});

describe('migrate command', () => {
  let rootDir: string;
  let server: TSServer;
  beforeEach(() => {
    rootDir = createDir();
    server = forkTSServerWithNoopLogger(
      path.resolve(__dirname, '../../../../../node_modules/typescript/lib/tsserver.js'),
    );
  });

  afterEach(() => {
    deleteDir(rootDir);
    server.kill();
  });

  it('Migrates project', async () => {
    const inputDir = path.resolve(__dirname, 'input');
    const outputDir = path.resolve(__dirname, 'output');
    const configDir = path.resolve(__dirname, 'config');

    copyDir(inputDir, rootDir);
    copyDir(configDir, rootDir);

    const config = new MigrateConfig().addPlugin(
      {
        name: 'test-plugin',
        run({ text }) {
          const newText = text.replace('test string', 'updated string');
          return newText;
        },
      },
      {},
    );

    const exitCode = await migrate({ rootDir, config, server });
    fs.unlinkSync(path.resolve(rootDir, 'tsconfig.json'));
    const [rootData, outputData] = getDirData(rootDir, outputDir);
    expect(rootData).toEqual(outputData);
    expect(exitCode).toBe(0);
  });
});
