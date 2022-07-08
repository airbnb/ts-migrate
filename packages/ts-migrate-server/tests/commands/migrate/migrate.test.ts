import path from 'path';
import fs from 'fs';
import { createDir, copyDir, deleteDir, getDirData } from '../../test-utils';
import migrate, { MigrateConfig } from '../../../src/migrate';

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

    const { exitCode } = await migrate({ rootDir, config });
    fs.unlinkSync(path.resolve(rootDir, 'tsconfig.json'));
    const [rootData, outputData] = getDirData(rootDir, outputDir);
    expect(rootData).toEqual(outputData);
    expect(exitCode).toBe(0);
  });

  describe('sources', () => {
    it('Migrates project by using `sources`', async () => {
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

      const { exitCode } = await migrate({
        rootDir,
        config,
        sources: 'index.ts',
      });
      fs.unlinkSync(path.resolve(rootDir, 'tsconfig.json'));
      const [rootData, outputData] = getDirData(rootDir, outputDir);
      expect(rootData).toEqual(outputData);
      expect(exitCode).toBe(0);
    });

    it('Migrates project by using `sources` with an absolute path', async () => {
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

      const { exitCode, updatedSourceFiles } = await migrate({
        rootDir,
        config,
        sources: path.resolve(rootDir, 'index.ts'),
      });
      fs.unlinkSync(path.resolve(rootDir, 'tsconfig.json'));
      const [rootData, outputData] = getDirData(rootDir, outputDir);
      expect(rootData).toEqual(outputData);
      expect(exitCode).toBe(0);

      const pathsRelativeToOutputDir = Array.from(updatedSourceFiles).map((filePath) =>
        path.relative(rootDir, filePath),
      );
      expect(pathsRelativeToOutputDir).toEqual(['index.ts']);
    });
  });

  it('Migrates project with two plugins', async () => {
    const inputDir = path.resolve(__dirname, 'input');
    const outputDir = path.resolve(__dirname, 'output_two');
    const configDir = path.resolve(__dirname, 'config');

    copyDir(inputDir, rootDir);
    copyDir(configDir, rootDir);

    const config = new MigrateConfig()
      .addPlugin(
        {
          name: 'test-plugin-1',
          run({ text }) {
            const newText = text.replace('test string', 'updated string');
            return newText;
          },
        },
        {},
      )
      .addPlugin(
        {
          name: 'test-plugin-2',
          run({ text }) {
            const newText = text.replace('updated string', 'another updated string');
            return newText;
          },
        },
        {},
      );

    const { exitCode } = await migrate({ rootDir, config });
    fs.unlinkSync(path.resolve(rootDir, 'tsconfig.json'));
    const [rootData, outputData] = getDirData(rootDir, outputDir);
    expect(rootData).toEqual(outputData);
    expect(exitCode).toBe(0);
  });
});
