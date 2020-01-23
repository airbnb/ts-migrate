import path from 'path';
import { tsIgnorePlugin, eslintFixPlugin, explicitAnyPlugin } from 'ts-migrate-plugins';
import { createDir, copyDir, deleteDir, getDirData } from '../../test-utils';
import migrate, { MigrateConfig } from '../../../commands/migrate';
import TSServer from '../../../commands/migrate/tsserver/TSServer';
import { forkTSServerWithNoopLogger } from '../../../commands/migrate/forkTSServer';

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
    server = forkTSServerWithNoopLogger();
  });

  afterEach(() => {
    deleteDir(rootDir);
    server.kill();
  });

  it('Migrates project', async () => {
    const inputDir = path.resolve(__dirname, 'input');
    const outputDir = path.resolve(__dirname, 'output');
    copyDir(inputDir, rootDir);
    const config = new MigrateConfig()
      .addPlugin(explicitAnyPlugin, { anyAlias: '$TSFixMe' })
      .addPlugin(tsIgnorePlugin, {})
      .addPlugin(eslintFixPlugin, {});

    const exitCode = await migrate({ rootDir, config, server });
    const [rootData, outputData] = getDirData(rootDir, outputDir);
    expect(rootData).toEqual(outputData);
    expect(exitCode).toBe(0);
  });
});
