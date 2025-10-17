const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Find the project root and workspace root
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

// Get default Expo config
const config = getDefaultConfig(projectRoot);

// Monorepo setup
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Ensure disableHierarchicalLookup is disabled for workspace packages
config.resolver.disableHierarchicalLookup = false;

// Explicitly set project root for proper resolution
config.projectRoot = projectRoot;

module.exports = config;
