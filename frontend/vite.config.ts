import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // Dev server proxy — intercepts /api/predict before it reaches Flask,
    // forwarding the browser's raw multipart request directly to the prediction
    // service. This avoids CORS and Python-requests re-encoding issues.
    server: {
      proxy: {
        '/api/predict': {
          target: 'https://agri-gpt-disease-prediction.onrender.com',
          changeOrigin: true,
          secure: false,
          rewrite: () => '/predict',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('[Vite Proxy] →', req.method, req.url, '——>', proxyReq.host + proxyReq.path);
            });
            proxy.on('proxyRes', (proxyRes) => {
              console.log('[Vite Proxy] ←', proxyRes.statusCode, proxyRes.statusMessage);
            });
            proxy.on('error', (err) => {
              console.error('[Vite Proxy] ERROR:', err.message);
            });
          },
        },
      },
    },
    // Performance optimizations for mobile
    build: {
      // Split chunks for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'animation': ['framer-motion'],
            'markdown': ['react-markdown'],
            'icons': ['lucide-react'],
            'pdf': ['jspdf', 'html2canvas']
            // Firebase excluded due to package.json issues - will be in main bundle
          }
        }
      },
      // Reduce chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Enable minification with esbuild (faster than terser)
      minify: 'esbuild',
      target: 'es2015'
    },
    // Make environment variables available
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL)
    },
  };
});
