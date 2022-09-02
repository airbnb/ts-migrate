import { createProject, Project } from '@ts-morph/bootstrap';
import ts from 'typescript';
import path from 'path';
import log from 'updatable-log';
import MigrateConfig from './MigrateConfig';
import PerfTimer from '../utils/PerfTimer';
import { PluginParams, LintConfig } from '../../types';

interface MigrateParams {
  rootDir: string;
  tsConfigDir?: string;
  config: MigrateConfig;
  sources?: string | string[];
  lintConfig?: LintConfig;
}

export default async function migrate({
  rootDir,
  tsConfigDir = rootDir,
  config,
  sources,
  lintConfig,
}: MigrateParams): Promise<{ exitCode: number; updatedSourceFiles: Set<string> }> {
  let exitCode = 0;
  log.info(`TypeScript version: ${ts.version}`);

  const serverInitTimer = new PerfTimer();

  // Normalize sources to be an array of full paths.
  if (sources !== undefined) {
    sources = Array.isArray(sources) ? sources : [sources];
    sources = sources.map((source) => path.resolve(rootDir, source));
    log.info(`Ignoring sources from tsconfig.json, using the ones provided manually instead.`);
  }

  const tsConfigFilePath = path.join(tsConfigDir, 'tsconfig.json');
  const project = await createProject({
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: sources !== undefined,
    skipFileDependencyResolution: true,
  });

  // If we passed in our own sources, let's add them to the project.
  // If not, let's just get all the sources in the project.
  if (sources) {
    await project.addSourceFilesByPaths(sources);
  }

  log.info(`Initialized tsserver project in ${serverInitTimer.elapsedStr()}.`);

  log.info('Start...');
  const pluginsTimer = new PerfTimer();
  const updatedSourceFiles = new Set<string>();
  const originalSourceFilesToMigrate = new Set<string>(
    getSourceFilesToMigrate(project).map((file) => file.fileName),
  );

  for (let i = 0; i < config.plugins.length; i += 1) {
    const { plugin, options: pluginOptions } = config.plugins[i];

    const pluginLogPrefix = `[${plugin.name}]`;
    const pluginTimer = new PerfTimer();
    log.info(`${pluginLogPrefix} Plugin ${i + 1} of ${config.plugins.length}. Start...`);

    const sourceFiles = getSourceFilesToMigrate(project).filter(({ fileName }) =>
      originalSourceFilesToMigrate.has(fileName),
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const sourceFile of sourceFiles) {
      const { fileName } = sourceFile;
      // const fileTimer = new PerfTimer();
      const relFile = path.relative(rootDir, sourceFile.fileName);
      const fileLogPrefix = `${pluginLogPrefix}[${relFile}]`;

      const getLanguageService = () => project.getLanguageService();

      const params: PluginParams<unknown> = {
        fileName,
        rootDir,
        sourceFile,
        text: sourceFile.text,
        options: pluginOptions,
        getLanguageService,
      };
      try {
        // eslint-disable-next-line no-await-in-loop
        const newText = await plugin.run(params, lintConfig);
        if (typeof newText === 'string' && newText !== sourceFile.text) {
          project.updateSourceFile(fileName, newText);
          updatedSourceFiles.add(sourceFile.fileName);
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

  log.info(`Writing ${updatedSourceFiles.size} updated file(s)...`);
  const writes = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const fileName of updatedSourceFiles) {
    const sourceFile = project.getSourceFileOrThrow(fileName);
    writes.push(project.fileSystem.writeFile(sourceFile.fileName, sourceFile.text));
  }
  await Promise.all(writes);

  log.info(`Wrote ${updatedSourceFiles.size} updated file(s) in ${writeTimer.elapsedStr()}.`);

  return { updatedSourceFiles, exitCode };
}

function getSourceFilesToMigrate(project: Project) {
  return project
    .getSourceFiles()
    .filter(({ fileName }) => !/(\.d\.ts|\.json)$|node_modules/.test(fileName));
}

export { MigrateConfig };
