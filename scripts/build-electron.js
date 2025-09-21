const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Electron application...');

try {
  // Build the React app
  console.log('1. Building React application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Update package.json main field for Electron
  console.log('2. Updating package.json for Electron...');
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Create a temporary package.json for Electron build
  const electronPackageJson = {
    ...packageJson,
    main: 'electron/main.js',
    homepage: './',
    scripts: {
      ...packageJson.scripts,
      'electron': 'electron .',
      'electron:dev': 'NODE_ENV=development electron .',
      'electron:pack': 'electron-builder --publish=never',
      'electron:dist': 'electron-builder --publish=always'
    }
  };

  fs.writeFileSync(packagePath, JSON.stringify(electronPackageJson, null, 2));

  // Build the Electron app
  console.log('3. Building Electron executable...');
  execSync('npx electron-builder', { stdio: 'inherit' });

  console.log('✅ Electron application built successfully!');
  console.log('📦 Check the dist-electron folder for your executable files');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}