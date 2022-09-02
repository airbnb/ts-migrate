import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { tsIgnorePlugin, eslintFixPlugin, explicitAnyPlugin } from 'ts-migrate-plugins';
import { migrate, MigrateConfig } from 'ts-migrate-server';
import { createDir, copyDir, deleteDir, getDirData } from '../../test-utils';

jest.mock('updatable-log', () => {
  // eslint-disable-next-line global-require
  const { mockUpdatableLog } = require('../../test-utils');
  return mockUpdatableLog();
});

describe('migrate command', () => {
  let rootDir: string;
  beforeEach(() => {
    rootDir = createDir();
  });

  afterEach(() => {
    deleteDir(rootDir);
  });

  it('Migrates project', async () => {
    const inputDir = path.resolve(__dirname, 'input');
    const outputDir = path.resolve(__dirname, 'output');
    copyDir(inputDir, rootDir);
    const config = new MigrateConfig()
      .addPlugin(explicitAnyPlugin, { anyAlias: '$TSFixMe' })
      .addPlugin(tsIgnorePlugin, { messagePrefix: 'FIXME' })
      .addPlugin(eslintFixPlugin, {});

    const { exitCode } = await migrate({ rootDir, config });
    const [rootData, outputData] = getDirData(rootDir, outputDir);
    expect(rootData).toEqual(outputData);
    expect(exitCode).toBe(0);
  }, 10000);
});
