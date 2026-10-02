const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Gluestack v1 (@react-aria) importa subpaths "react-aria/private/*"
    // declarados en el campo "exports". Sin esto Metro 0.81 no los resuelve.
    unstable_enablePackageExports: true,
    // zustand expone su build ESM (.mjs) vía "exports.import", que usa
    // `import.meta` — soportado por Metro en dev pero NO por hermesc en
    // release. Forzamos su build CJS (index.js / middleware.js).
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
        const sub = moduleName === 'zustand' ? 'index' : moduleName.slice('zustand/'.length);
        const abs = path.join(__dirname, 'node_modules', 'zustand', `${sub}.js`);
        return context.resolveRequest(context, abs, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
