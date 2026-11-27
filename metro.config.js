// Points app code's `react-native` imports at src/i18n/rn-shim.tsx so <Text> can auto-translate.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const shim = path.resolve(__dirname, 'src/i18n/rn-shim.tsx');
const appDirs = [path.resolve(__dirname, 'app') + path.sep, path.resolve(__dirname, 'src') + path.sep];
const skip = path.resolve(__dirname, 'src/i18n') + path.sep;

// Web: expo-sqlite runs SQLite as WebAssembly.
config.resolver.assetExts.push('wasm');

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const from = context.originModulePath || '';
  if (moduleName === 'react-native' && !from.startsWith(skip) && appDirs.some((d) => from.startsWith(d))) {
    return { type: 'sourceFile', filePath: shim };
  }
  return upstream ? upstream(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
