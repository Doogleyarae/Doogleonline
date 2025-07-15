import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking build output...');

const distPath = path.join(__dirname, 'dist', 'public');
const indexHtmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(distPath)) {
  console.error('❌ Build directory not found. Please run "npm run build" first.');
  process.exit(1);
}

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found in build output.');
  process.exit(1);
}

console.log('✅ Build directory exists');
console.log('✅ index.html found');

// Check for assets directory
const assetsPath = path.join(distPath, 'assets');
if (fs.existsSync(assetsPath)) {
  const assets = fs.readdirSync(assetsPath);
  console.log(`✅ Assets directory found with ${assets.length} files`);
  
  // Look for JavaScript chunks
  const jsFiles = assets.filter(file => file.endsWith('.js'));
  console.log(`📦 Found ${jsFiles.length} JavaScript chunks:`);
  jsFiles.forEach(file => console.log(`   - ${file}`));
} else {
  console.warn('⚠️  Assets directory not found');
}

console.log('\n🎉 Build verification complete!');
console.log('💡 If you\'re still seeing module loading errors, try:');
console.log('   1. Clear your browser cache');
console.log('   2. Check the browser console for specific errors');
console.log('   3. Ensure your server is serving the correct files'); 