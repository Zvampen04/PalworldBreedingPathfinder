import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './App.css';

// Add error handling for React rendering
console.log('🚀 main.tsx loaded - initializing React app...');

const root = document.getElementById('root');

if (root) {
  try {
    console.log('✅ Found root element, creating React root...');
    const reactRoot = ReactDOM.createRoot(root);
    
    console.log('✅ React root created, rendering app...');
    reactRoot.render(
      <React.StrictMode>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <App />
      </React.StrictMode>
    );
    console.log('✅ React app rendered successfully');
  } catch (error) {
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
  console.error('❌ Root element not found');
}
