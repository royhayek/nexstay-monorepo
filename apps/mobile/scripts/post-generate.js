#!/usr/bin/env node

/**
 * Post-generation script for Orval
 *
 * This script runs after Orval generates the API client code.
 * It replaces imports from 'custom-instance' with 'axios' to use
 * our configured axios instance with interceptors.
 */

const fs = require("fs");
const path = require("path");

// Get all TypeScript files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith(".ts")) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const apiDir = path.join(__dirname, "../api");
const queriesDir = path.join(apiDir, "queries");

// Find all generated TypeScript files
const files = getAllFiles(queriesDir);

console.log(`\n🔧 Post-processing ${files.length} generated files...`);

let filesModified = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, "utf-8");
  let modified = false;

  // Replace import from custom-instance with axios
  const importPattern = /from ["']\.\.\/\.\.\/\.\.\/custom-instance["']/g;
  if (importPattern.test(content)) {
    content = content.replace(importPattern, 'from "../../../axios"');
    modified = true;
  }

  // Also handle protected API paths (one level deeper)
  const protectedImportPattern = /from ["']\.\.\/\.\.\/\.\.\/\.\.\/custom-instance["']/g;
  if (protectedImportPattern.test(content)) {
    content = content.replace(protectedImportPattern, 'from "../../../../axios"');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, "utf-8");
    filesModified++;
  }
});

console.log(`✅ Modified ${filesModified} files to use configured axios instance\n`);
