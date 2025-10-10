const fs = require('fs');
const path = require('path');

// Copy email templates
const templatesrcDir = path.join(__dirname, 'src', 'common', 'templates');
const templateDestDir = path.join(__dirname, 'dist', 'common', 'templates');

// Ensure destination directory exists
fs.mkdirSync(templateDestDir, { recursive: true });

// Copy all .hbs files
fs.readdirSync(templatesrcDir).forEach((file) => {
  if (file.endsWith('.hbs')) {
    fs.copyFileSync(path.join(templatesrcDir, file), path.join(templateDestDir, file));
  }
});

console.log('✅ Email templates copied to dist');

// Copy i18n translation files
const i18nSrcDir = path.join(__dirname, 'src', 'i18n');
const i18nDestDir = path.join(__dirname, 'dist', 'i18n');

// Function to copy directory recursively
function copyDir(src, dest) {
  // Ensure destination directory exists
  fs.mkdirSync(dest, { recursive: true });
  
  // Read all files/folders from source
  const items = fs.readdirSync(src);
  
  items.forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    if (fs.statSync(srcPath).isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else if (item.endsWith('.json')) {
      // Copy JSON translation files
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copy i18n files
copyDir(i18nSrcDir, i18nDestDir);

console.log('✅ i18n translation files copied to dist');
console.log('🎉 All static assets copied successfully!');
