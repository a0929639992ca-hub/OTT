
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 解決瀏覽器環境找不到 process 的問題
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env': {
       API_KEY: JSON.stringify(process.env.API_KEY)
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@google/genai']
        }
      }
    }
  }
});
