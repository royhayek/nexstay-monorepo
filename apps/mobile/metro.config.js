const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project root and workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Get default Expo config
const config = getDefaultConfig(projectRoot);

// Monorepo setup - Merge with default watchFolders instead of replacing
config.watchFolders = config.watchFolders || [];
if (!config.watchFolders.includes(workspaceRoot)) {
  config.watchFolders.push(workspaceRoot);
}
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Ensure disableHierarchicalLookup is disabled for workspace packages
config.resolver.disableHierarchicalLookup = false;

// Explicitly set project root for proper resolution
config.projectRoot = projectRoot;

// Enable require.context for expo-router
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
