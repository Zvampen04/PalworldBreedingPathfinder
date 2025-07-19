// Mark that main.tsx has loaded
(window as any).mainTsxLoaded = true;
console.log('🚀 main.tsx module started loading...');

// Declare global debug function
declare global {
  interface Window {
    updateDebug?: (message: string, type?: string) => void;
  }
}

import React from 'react';
import ReactDOM from "react-dom/client";
import './App.css';
import App from './App';

// Add immediate debug output
function updatePageDebug(message: string, type: string = 'info') {
  console.log(message);
  // Use the global debug function if available
  if (typeof window.updateDebug === 'function') {
    window.updateDebug(message, type);
  } else {
    // Fallback to direct DOM manipulation
    const debugStatus = document.getElementById('debug-status');
    if (debugStatus) {
      const timestamp = new Date().toLocaleTimeString();
      debugStatus.innerHTML += `<div class="debug-${type}">[${timestamp}] ${message}</div>`;
      debugStatus.scrollTop = debugStatus.scrollHeight;
    }
  }
}

updatePageDebug('🎯 main.tsx module execution started');

try {
  updatePageDebug('📦 Core imports completed');
  console.log('✅ Core imports successful');

  updatePageDebug('📦 main.tsx module loaded - initializing React app...');

  const root = document.getElementById('root');

  if (root) {
    try {
      updatePageDebug('✅ Found root element, creating React root...');
      const reactRoot = ReactDOM.createRoot(root);
      
      updatePageDebug('📦 Attempting to render App component...');
      
      // Mark that App.tsx is being executed
      (window as any).appTsxLoaded = true;
      
      reactRoot.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      
      updatePageDebug('✅ React app rendered successfully');
      console.log('✅ React app rendered successfully');
      
    } catch (error) {
      updatePageDebug('❌ Error rendering React app: ' + error);
      console.error('❌ Error rendering React app:', error);
      if (error instanceof Error) {
        updatePageDebug('   Error name: ' + error.name);
        updatePageDebug('   Error message: ' + error.message);
        updatePageDebug('   Error stack: ' + (error.stack || 'No stack').substring(0, 300));
      }
    }
  } else {
    updatePageDebug('❌ Root element not found');
    console.error('❌ Root element not found');
  }
} catch (error) {
  updatePageDebug('❌ Error in main.tsx: ' + error);
  console.error('❌ Error in main.tsx:', error);
  if (error instanceof Error) {
    updatePageDebug('   Error name: ' + error.name);
    updatePageDebug('   Error message: ' + error.message);
    updatePageDebug('   Error stack: ' + (error.stack || 'No stack').substring(0, 300));
  }
}
