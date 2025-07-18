import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './App.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <App />
    </React.StrictMode>
  );
}
