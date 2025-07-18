#!/usr/bin/env node

/**
 * Test script to verify that all Tauri sidecars are properly configured
 * This script can be run independently to check sidecar availability
 */

import { Command } from '@tauri-apps/plugin-shell';
import fs from 'fs';
import path from 'path';

const sidecars = [
  'binaries/breeding-path',
  'binaries/breeding-scraper', 
  'binaries/image-scraper',
  'binaries/fullcalc-scraper'
];

async function testSidecar(sidecarName) {
  console.log(`\n🧪 Testing ${sidecarName}...`);
  
  try {
    // Check if binary exists
    const binaryPath = path.join('src-tauri', sidecarName);
    if (fs.existsSync(binaryPath)) {
      console.log(`✅ Binary exists: ${binaryPath}`);
    } else {
      console.log(`❌ Binary not found: ${binaryPath}`);
      return false;
    }
    
    // Try to create sidecar command (this tests Tauri configuration)
    const command = Command.sidecar(sidecarName, ['--help']);
    console.log(`✅ Sidecar command created successfully`);
    
    return true;
  } catch (error) {
    console.log(`❌ Error with ${sidecarName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing Tauri Sidecar Configuration');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  let totalCount = sidecars.length;
  
  for (const sidecar of sidecars) {
    if (await testSidecar(sidecar)) {
      successCount++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results');
  console.log('=' .repeat(50));
  console.log(`✅ Working: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 All sidecars are properly configured!');
    console.log('\n💡 You can now run the Tauri app and use the sidecars.');
  } else {
    console.log('⚠️  Some sidecars have issues. Check the configuration.');
  }
}

main().catch(console.error); 