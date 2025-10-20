#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all files with syntax errors
const files = glob.sync('src/api/models/admin/*.ts');

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix [object Object] syntax error
  if (content.includes('[object Object]')) {
    console.log(`Fixing [object Object] in: ${file}`);
    content = content.replace(/\[object Object\]/g, "'INVALID_ENUM'");
    modified = true;
  }

  // Fix invalid enum object syntax like: 'key': value1,value2,value3,
  // Pattern: 'string_with_commas': unquoted,identifiers,here,
  const invalidEnumPattern = /^(\s+)'([^']+)': ([a-zA-Z_][a-zA-Z0-9_,\s]*),\s*$/gm;
  if (invalidEnumPattern.test(content)) {
    console.log(`Fixing invalid enum syntax in: ${file}`);
    content = content.replace(invalidEnumPattern, (match, indent, key, values) => {
      // Remove lines with invalid unquoted enum values
      return '';
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('✅ API models fixed!');
