import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './App.css';

// Mark that main.tsx has loaded
(window as any).mainTsxLoaded = true;
console.log('🚀 main.tsx module imported successfully');

// Add error handling for React rendering
console.log('🚀 main.tsx loaded - initializing React app...');

// Update debug info on the page
const debugStatus = document.getElementById('debug-status');
function updatePageDebug(message: string) {
  console.log(message);
  if (debugStatus) {
    debugStatus.innerHTML += '<br>' + message;
  }
}

updatePageDebug('📦 main.tsx module loaded');
updatePageDebug('🔍 Checking dependencies...');
updatePageDebug('   - React: ' + (typeof React !== 'undefined' ? '✅' : '❌'));
updatePageDebug('   - ReactDOM: ' + (typeof ReactDOM !== 'undefined' ? '✅' : '❌'));

const root = document.getElementById('root');

if (root) {
  try {
    updatePageDebug('✅ Found root element, creating React root...');
    console.log('✅ Found root element, creating React root...');
    const reactRoot = ReactDOM.createRoot(root);
    
    updatePageDebug('✅ React root created, rendering app...');
    console.log('✅ React root created, rendering app...');
    
    updatePageDebug('🔄 About to render React app...');
    reactRoot.render(
      <React.StrictMode>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <App />
      </React.StrictMode>
    );
    updatePageDebug('✅ React app rendered successfully');
    console.log('✅ React app rendered successfully');
    
    // Clear the loading screen after a short delay
    setTimeout(() => {
      updatePageDebug('🎉 React should be visible now');
    }, 100);
    
  } catch (error) {
    updatePageDebug('❌ Error rendering React app: ' + (error instanceof Error ? error.message : 'Unknown error'));
    console.error('❌ Error rendering React app:', error);
    
    // Fallback error display
    root.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div style="text-align: center; color: red;">
          <h2>⚠️ React Failed to Load</h2>
          <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <details style="margin-top: 20px; text-align: left;">
            <summary>Error Details</summary>
            <pre style="background: #f0f0f0; padding: 10px; border-radius: 5px; overflow: auto;">
${error instanceof Error ? error.stack : JSON.stringify(error, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    `;
  }
} else {
  updatePageDebug('❌ Root element not found');
  console.error('❌ Root element not found');
}
