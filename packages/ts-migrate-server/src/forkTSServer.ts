/**
 * Create TS Server with forked tsserver process.
 * See also https://github.com/Microsoft/vscode/blob/dfafad3a00f02469b644c76613d08716b8b31d8d/extensions/typescript-language-features/src/tsServer/server.ts#L139
 */
import { fork } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import log from 'updatable-log';
import { FileLogger, LogLevel, NoopLogger } from './tsserver/Logger';
import TSServer from './tsserver/TSServer';

const tssPathDefault = path.resolve(path.dirname(require.resolve('typescript')), 'tsserver.js');

/**
 * Create TSServer with default configuration.
 */
export default function forkTSServer(tssPath = tssPathDefault) {
  log.info('forkTSServer');
  const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-migrate-log-'));
  log.info(`Logs in ${logDir}`);
  const tsmLogFile = path.resolve(logDir, 'ts-migrate-tsserver.log');
  const tssLogFile = path.resolve(logDir, 'tsserver.log');
  const cancellationPipeFile = `${path.resolve(logDir, 'ts-cancellation.tmp')}*`;

  const tsArgs = [
    '--useSingleInferredProject',
    '--cancellationPipeName',
    cancellationPipeFile,
    '--logVerbosity',
    'verbose',
    '--logFile',
    tssLogFile,
    '--locale',
    'en',
    '--noGetErrOnBackgroundUpdate',
    '--disableAutomaticTypingAcquisition',
  ];

  const childProcess = fork(tssPath, tsArgs, { silent: true });
  const tsmLogger = new FileLogger(tsmLogFile, false, LogLevel.verbose);
  return new TSServer(childProcess, tsmLogger);
}

/**
 * Create TSServer without logging.
 * Useful for testing.
 */
export function forkTSServerWithNoopLogger(tssPath = tssPathDefault) {
  const childProcess = fork(
    tssPath,
    ['--useSingleInferredProject', '--locale', 'en', '--noGetErrOnBackgroundUpdate'],
    { silent: true },
  );
  return new TSServer(childProcess, new NoopLogger());
}
