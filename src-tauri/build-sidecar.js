#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Building Palworld Breeding Path Sidecar...');

const isWindows = process.platform === 'win32';
const extension = isWindows ? '.exe' : '';

try {
  // Get the current target triple
  const rustInfo = execSync('rustc -vV', { encoding: 'utf8' });
  const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];
  
  if (!targetTriple) {
    console.error('❌ Failed to determine platform target triple');
    process.exit(1);
  }
  
  console.log(`📋 Target platform: ${targetTriple}`);
  
  // Build the binary using PyInstaller
  console.log('🏗️  Running PyInstaller...');
  
  const specFile = `breeding-path-${targetTriple}.spec`;
  if (!fs.existsSync(specFile)) {
    console.error(`❌ PyInstaller spec file not found: ${specFile}`);
    console.log('💡 Please ensure the PyInstaller spec file exists or run PyInstaller manually first');
    process.exit(1);
  }
  
  execSync(`pyinstaller ${specFile} --noconfirm`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  // Find the generated binary
  const platformSpecificName = `breeding-path-${targetTriple}${extension}`;
  const genericName = `breeding-path${extension}`;
  
  const distPath = path.join('dist', platformSpecificName);
  const binariesPath = path.join('binaries', genericName);
  
  // Ensure binaries directory exists
  if (!fs.existsSync('binaries')) {
    fs.mkdirSync('binaries', { recursive: true });
  }
  
  // Copy the binary to the correct location with the generic name
  if (fs.existsSync(distPath)) {
    console.log(`📦 Copying ${distPath} → ${binariesPath}`);
    fs.copyFileSync(distPath, binariesPath);
    
    // Also copy to platform-specific name for backup
    const platformBinaryPath = path.join('binaries', platformSpecificName);
    fs.copyFileSync(distPath, platformBinaryPath);
    
    console.log('✅ Sidecar binary built successfully!');
    console.log(`   Generic binary: ${binariesPath}`);
    console.log(`   Platform binary: ${platformBinaryPath}`);
    
    // Test the binary
    console.log('🧪 Testing binary...');
    const testOutput = execSync(`"${binariesPath}" --help`, { encoding: 'utf8' });
    console.log('✅ Binary test passed!');
    
  } else {
    console.error(`❌ Generated binary not found at: ${distPath}`);
    console.log('💡 Check PyInstaller output for errors');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 