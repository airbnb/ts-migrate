import ts from 'typescript';
import path from 'path';
import log from 'updatable-log';
import { TSServer, CommandTypes } from '../index';
import MigrateConfig from './MigrateConfig';
import { parseTSConfig } from './ParseTSConfig';
import PerfTimer from '../utils/PerfTimer';
import { PluginParams } from '../../types';

interface MigrateParams {
  rootDir: string;
  tsConfigDir?: string;
  config: MigrateConfig;
  server: TSServer;
}

export default async function migrate({ rootDir, tsConfigDir = rootDir, config, server }: MigrateParams): Promise<number> {
  let exitCode = 0;

  const parseResult = parseTSConfig(tsConfigDir);
  const { options } = parseResult;
  const projectFileName = path.resolve(rootDir, '../..', parseResult.configFile);
  const fileNames = parseResult.fileNames.map((fileName) =>
    path.resolve(rootDir, '../..', fileName),
  );
  const serverInitTimer = new PerfTimer();
  await server.sendRequest(CommandTypes.Configure, { hostInfo: 'ts-migrate' });

  const status = await server.sendRequest(CommandTypes.Status, {});
  log.info(`TypeScript version: ${status.version}`);

  // Notify the server that the client has file open.
  // The server will not monitor the filesystem for changes in this file and will assume that the client
  // is updating the server (using the change and/or reload messages) when the file changes.
  // eslint-disable-next-line no-restricted-syntax
  for (const file of fileNames) {
    // eslint-disable-next-line no-await-in-loop
    await server.sendRequest(CommandTypes.Open, {
      file,
      projectFileName,
      projectRootPath: rootDir,
    });
  }

  log.info(`Initialized tsserver project in ${serverInitTimer.elapsedStr()}.`);

  const filesToProcess = fileNames.filter((fileName) => !/(\.d\.ts|\.json)$/.test(fileName));

  const sourceFiles: { [fileName: string]: { sourceFile: ts.SourceFile; updated: boolean } } = {};
  const scriptTarget = options.target != null ? options.target : ts.ScriptTarget.Latest;

  const getOrCreateSourceFile = (fileName: string) => {
    if (sourceFiles[fileName] == null) {
      sourceFiles[fileName] = {
        sourceFile: ts.createSourceFile(
          fileName,
          ts.sys.readFile(fileName) || '',
          scriptTarget,
          /* setParentNodes */ true,
        ),
        updated: false,
      };
    }

    return sourceFiles[fileName];
  };

  const setSourceFile = (fileName: string, sourceFile: ts.SourceFile) => {
    const prevText = sourceFiles[fileName] ? sourceFiles[fileName].sourceFile.text : undefined;
    const prevUpdated = sourceFiles[fileName] ? sourceFiles[fileName].updated : false;
    const updated = prevUpdated || prevText !== sourceFile.text;
    sourceFiles[fileName] = { sourceFile, updated };
  };

  log.info('Start...');
  const pluginsTimer = new PerfTimer();

  for (let i = 0; i < config.plugins.length; i += 1) {
    const { plugin, options: pluginOptions } = config.plugins[i];

    const pluginLogPrefix = `[${plugin.name}]`;
    const pluginTimer = new PerfTimer();
    log.info(`${pluginLogPrefix} Plugin ${i + 1} of ${config.plugins.length}. Start...`);

    // eslint-disable-next-line no-restricted-syntax
    for (const file of filesToProcess) {
      const relFile = path.relative(rootDir, file);
      const fileLogPrefix = `${pluginLogPrefix}[${relFile}]`;
      // const fileTimer = new PerfTimer();
      // log.info(`${fileLogPrefix} Start...`);

      const { sourceFile } = getOrCreateSourceFile(file);

      const updateFile = async (newText: string) => {
        ts.sys.writeFile(file, newText);
        await server.sendRequest(CommandTypes.Reload, {
          file,
          projectFileName,
          tmpfile: file,
        });
      };

      const { text } = sourceFile;
      const params: PluginParams<unknown> = {
        options: pluginOptions,
        fileName: sourceFile.fileName,
        rootDir,
        text,
        sourceFile,
        async getDiagnostics() {
          const semanticDiagnostics = await server.sendRequest(
            CommandTypes.SemanticDiagnosticsSync,
            { file, projectFileName, includeLinePosition: true },
          );

          const syntacticDiagnostics = await server.sendRequest(
            CommandTypes.SyntacticDiagnosticsSync,
            { file, projectFileName, includeLinePosition: true },
          );

          const suggestionDiagnostics = await server.sendRequest(
            CommandTypes.SuggestionDiagnosticsSync,
            { file, projectFileName, includeLinePosition: true },
          );

          return {
            semanticDiagnostics: semanticDiagnostics || [],
            syntacticDiagnostics: syntacticDiagnostics || [],
            suggestionDiagnostics: suggestionDiagnostics || [],
          };
        },
      };

      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await plugin.run(params);
        if (typeof result === 'string') {
          if (result !== text) {
            setSourceFile(
              file,
              sourceFile.update(result, {
                newLength: result.length,
                span: { start: 0, length: text.length },
              }),
            );

            // eslint-disable-next-line no-await-in-loop
            await updateFile(result);
          }
        }
      } catch (pluginErr) {
        log.error(`${fileLogPrefix} Error:\n`, pluginErr);
        exitCode = -1;
      }

      // log.info(`${fileLogPrefix} Finished in ${fileTimer.elapsedStr()}.`);
    }

    log.info(`${pluginLogPrefix} Finished in ${pluginTimer.elapsedStr()}.`);
  }

  log.info(`Finished in ${pluginsTimer.elapsedStr()}, for ${config.plugins.length} plugin(s).`);

  const writeTimer = new PerfTimer();
  const updatedSourceFiles = Object.values(sourceFiles)
    .filter(({ updated }) => updated)
    .map(({ sourceFile }) => sourceFile);

  log.info(`Writing ${updatedSourceFiles.length} updated file(s)...`);
  updatedSourceFiles.forEach((sourceFile) => {
    ts.sys.writeFile(sourceFile.fileName, sourceFile.text);
  });

  log.info(`Wrote ${updatedSourceFiles.length} updated file(s) in ${writeTimer.elapsedStr()}.`);

  return exitCode;
}

export { MigrateConfig };
