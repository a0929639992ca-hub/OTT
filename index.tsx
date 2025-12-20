import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// 移除 StrictMode 以避免在開發環境或某些 CDN 環境下的雙重觸發行為，確保搜尋行為單一化
root.render(<App />);
