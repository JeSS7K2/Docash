module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    // Gluestack v1 (@react-stately .mjs) usa static class blocks que el
    // preset de RN no transforma por defecto.
    '@babel/plugin-transform-class-static-block',
    // Reanimated plugin must be listed last.
    'react-native-reanimated/plugin',
  ],
};
