import path from 'path';
import rename from '../../../commands/rename';
import { createDir, copyDir, deleteDir, getDirData } from '../../test-utils';

jest.mock('updatable-log', () => {
  // eslint-disable-next-line global-require
  const { mockUpdatableLog } = require('../../test-utils');
  return mockUpdatableLog();
});

describe('rename command', () => {
  let rootDir: string;
  beforeEach(() => {
    rootDir = createDir();
  });

  afterEach(() => {
    deleteDir(rootDir);
  });

  it('Renames JS/JSX files to TS/TSX', () => {
    const inputDir = path.resolve(__dirname, 'input');
    const outputDir = path.resolve(__dirname, 'output');
    copyDir(inputDir, rootDir);

    const renamedFiles = rename({ rootDir });
    const renamedFilesRelativeToRootDir = renamedFiles
      ?.map(({ oldFile, newFile }) => {
        const filePathRelativeToRootDir = (filePath: string) => path.relative(rootDir, filePath);
        return {
          oldFile: filePathRelativeToRootDir(oldFile),
          newFile: filePathRelativeToRootDir(newFile),
        };
      })
      .sort((a, b) => {
        const getSortKey = ({ oldFile, newFile }: typeof a) => oldFile + newFile;
        const sortKeyA = getSortKey(a);
        const sortKeyB = getSortKey(b);

        if (sortKeyA === sortKeyB) {
          return 0;
        }

        return sortKeyA < sortKeyB ? -1 : 1;
      });

    const [rootData, outputData] = getDirData(rootDir, outputDir);
    expect(rootData).toEqual(outputData);
    expect(renamedFilesRelativeToRootDir).toEqual([
      { oldFile: 'dir-a/file-2.js', newFile: 'dir-a/file-2.ts' },
      { oldFile: 'dir-a/file-3.jsx', newFile: 'dir-a/file-3.tsx' },
      { oldFile: 'dir-a/file-4.js', newFile: 'dir-a/file-4.tsx' },
      { oldFile: 'dir-a/file-5.js', newFile: 'dir-a/file-5.tsx' },
      { oldFile: 'dir-a/file-6.js', newFile: 'dir-a/file-6.tsx' },
      { oldFile: 'file-1.js', newFile: 'file-1.ts' },
    ]);
  });
});
