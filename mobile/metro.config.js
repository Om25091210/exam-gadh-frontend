// The phone app shares the typed API client, the Hindi/English dictionaries and the exam logic with the web app.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.join(root, 'packages'), path.join(root, 'apps/web/src/lib/exam')];

const alias = {
  '@eg/api': path.join(root, 'packages/api/src/index.ts'),
  '@eg/i18n': path.join(root, 'packages/i18n/src/index.ts'),
};
const examDir = path.join(root, 'apps/web/src/lib/exam');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (alias[moduleName]) return { type: 'sourceFile', filePath: alias[moduleName] };
  if (moduleName.startsWith('@eg/exam/')) return { type: 'sourceFile', filePath: path.join(examDir, moduleName.slice('@eg/exam/'.length) + '.ts') };
  return context.resolveRequest(context, moduleName, platform);
};
// files outside the project (the shared packages) must find react & friends in this project
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
module.exports = config;
