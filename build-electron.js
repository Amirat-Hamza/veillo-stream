#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building desktop application...\n');

// Clean previous electron build
if (fs.existsSync('dist-electron')) {
  fs.rmSync('dist-electron', { recursive: true, force: true });
  console.log('🧹 Cleaned previous electron build');
}

// Build web app first if dist doesn't exist
if (!fs.existsSync('dist')) {
  console.log('📦 Building web application first...');
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Web build failed:', error);
      return;
    }
    console.log('✅ Web build completed');
    buildElectron();
  });
} else {
  buildElectron();
}

function buildElectron() {
  console.log('🖥️  Building desktop application...');
  exec('npx electron-builder', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Desktop build failed:', error);
      console.error(stderr);
      return;
    }
    
    console.log('✅ Desktop build completed successfully!');
    console.log('📁 Desktop executables available in: ./dist-electron\n');
    console.log(stdout);
  });
}