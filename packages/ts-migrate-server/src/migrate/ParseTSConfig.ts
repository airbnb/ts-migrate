import ts from 'typescript';

export function parseTSConfig(rootDir: string) {
  const configFile = ts.findConfigFile(rootDir, ts.sys.fileExists, 'tsconfig.json');
  if (!configFile) {
    throw new Error("Could not find a valid 'tsconfig.json'.");
  }

  const configFileContents = ts.sys.readFile(configFile);
  if (configFileContents == null) {
    throw new Error(`Failed to read TypeScript config file: ${configFile}`);
  }

  const { config, error } = ts.parseConfigFileTextToJson(configFile, configFileContents);
  if (error) {
    const errorMessage = ts.flattenDiagnosticMessageText(error.messageText, ts.sys.newLine);
    throw new Error(`Error parsing TypeScript config file ${configFile}: ${errorMessage}`);
  }

  const { options, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, rootDir);

  if (errors.length > 0) {
    const errorMessage = ts.formatDiagnostics(errors, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => rootDir,
      getNewLine: () => ts.sys.newLine,
    });
    throw new Error(`Errors parsing TypeScript config: ${errorMessage}`);
  }

  return { configFile, options, fileNames };
}
