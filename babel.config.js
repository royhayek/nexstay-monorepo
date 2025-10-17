// Root babel config for monorepo
// This config is used by Babel when resolving from the workspace root
// Individual apps (like mobile) have their own babel.config.js that takes precedence

module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
  };
};
