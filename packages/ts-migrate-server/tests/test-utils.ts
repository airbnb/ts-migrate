import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import glob from 'glob';
import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import rimraf from 'rimraf';
import log from 'updatable-log';

function assertDirExists(dir: string) {
  if (!fs.existsSync(dir)) {
    throw new Error(`${dir} does not exist.`);
  }
}

export function createDir() {
  if (!fs.existsSync(path.resolve(__dirname, 'tmp'))) {
    fs.mkdirSync(path.resolve(__dirname, 'tmp'));
  }
  return fs.mkdtempSync(path.resolve(__dirname, 'tmp/ts-migrate-'));
}

export function copyDir(srcDir: string, destDir: string) {
  assertDirExists(srcDir);
  assertDirExists(destDir);

  const copyFile = (src: string, dest: string) => {
    const destDirname = path.dirname(dest);

    if (!fs.existsSync(destDirname)) {
      destDirname.split(path.sep).reduce((prev, cur) => {
        const dir = path.join(prev, cur, path.sep);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        return dir;
      }, '');
    }

    fs.copyFileSync(src, dest);
  };

  glob.sync(`${srcDir}/**/*`, { nodir: true }).forEach((src) => {
    const dest = path.resolve(destDir, path.relative(srcDir, src));
    copyFile(src, dest);
  });
}

export function deleteDir(dir: string) {
  assertDirExists(dir);
  rimraf.sync(dir);
}

export function getDirData(dir1: string, dir2: string) {
  const files = new Set<string>();
  [dir1, dir2].forEach((dir) => {
    assertDirExists(dir);

    glob.sync(`${dir}/**/*`, { nodir: true }).forEach((file) => {
      files.add(path.relative(dir, file));
    });
  });

  type Result = { file: string; fileContent: string | undefined };
  const results: [Result[], Result[]] = [[], []];

  Array.from(files).forEach((file) => {
    const file1 = path.resolve(dir1, file);
    const content1 = fs.existsSync(file1) ? fs.readFileSync(file1, 'utf-8') : undefined;

    const file2 = path.resolve(dir2, file);
    const content2 = fs.existsSync(file2) ? fs.readFileSync(file2, 'utf-8') : undefined;

    results[0].push({ file, fileContent: content1 });
    results[1].push({ file, fileContent: content2 });
  });

  return results;
}

/* eslint-disable no-console */
export const mockUpdatableLog: () => typeof log = () => ({
  error: (...msg: unknown[]) => {
    console.log('log.error:', ...msg);
  },
  important: (...msg: unknown[]) => {
    console.log('log.important:', ...msg);
  },
  info: (...msg: unknown[]) => {
    console.log('log.info:', ...msg);
  },
  warn: (...msg: unknown[]) => {
    console.log('log.warn:', ...msg);
  },
  update: (...msg: unknown[]) => {
    console.log('log.update:', ...msg);
  },
  clear: () => {},
  quiet: false,
});
/* eslint-enable no-console */

export const noopUpdatableLog: () => typeof log = () => ({
  error: () => {},
  important: () => {},
  info: () => {},
  warn: () => {},
  update: () => {},
  clear: () => {},
  quiet: false,
});
