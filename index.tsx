
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical rendering error:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: white; background: #000; font-family: sans-serif;">
      <h1>應用程式載入失敗</h1>
      <p>請檢查網路連線或稍後再試。</p>
      <pre style="color: red; background: #111; padding: 10px;">${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}
