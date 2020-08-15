/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Must provide frontend folder arg');
  process.exit(1);
}

const project = path.basename(process.argv[2]);
const rootDir = path.resolve(__dirname, '../../..');
const projectDir = path.resolve(rootDir, 'frontend', project);
if (!fs.existsSync(projectDir)) {
  console.error(`Project "${project}" does not exist at "${projectDir}"`);
  process.exit(1);
}

const overrideFiles = ['config/eslint/overrides.js'].map((relativeFileName) =>
  path.resolve(rootDir, relativeFileName),
);
overrideFiles.forEach((overrideFile) => {
  let contents = fs.readFileSync(overrideFile, 'utf8');
  contents = contents.replace(new RegExp(`('frontend/${project}/.*).j(sx?')`, 'g'), '$1.t$2');
  fs.writeFileSync(overrideFile, contents);
});
