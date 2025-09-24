#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting News Veille build process...\n');

// Step 1: Clean previous builds
console.log('🧹 Cleaning previous builds...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
if (fs.existsSync('dist-electron')) {
  fs.rmSync('dist-electron', { recursive: true, force: true });
}

// Step 2: Build web application
console.log('📦 Building web application...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Web build failed:', error);
    return;
  }
  
  console.log('✅ Web build completed successfully!');
  console.log('📁 Web files available in: ./dist\n');
  
  // Step 3: Build desktop application
  console.log('🖥️  Building desktop application...');
  exec('npm run electron:build', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Desktop build failed:', error);
      return;
    }
    
    console.log('✅ Desktop build completed successfully!');
    console.log('📁 Desktop executables available in: ./dist-electron\n');
    
    // Show final summary
    console.log('🎉 Build process completed!\n');
    console.log('📋 Available outputs:');
    console.log('   • Web application: ./dist/');
    console.log('   • Desktop executable: ./dist-electron/');
    console.log('\n💡 You can now:');
    console.log('   • Deploy web files from ./dist/ to any web server');
    console.log('   • Distribute the desktop app from ./dist-electron/');
  });
});