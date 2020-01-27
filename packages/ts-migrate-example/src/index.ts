import path from 'path';
import { forkTSServer, migrate, MigrateConfig } from 'ts-migrate-server';

import simplePlugin from './simplePlugin';

// it will change content of the index.ts in the input folder
async function runMigration() {
  const inputDir = path.resolve(__dirname, 'input');

  const server = forkTSServer();

  process.on('exit', () => {
    server.kill();
  });

  const config = new MigrateConfig()
    .addPlugin(simplePlugin, { shouldReplaceText: true });

  const exitCode = await migrate({ rootDir: inputDir, config, server });

  server.kill();
  process.exit(exitCode);
}

runMigration();