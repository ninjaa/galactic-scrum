import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path when served in production
  base: './',
  
  // Development server configuration
  server: {
    open: true, // Automatically open browser
    port: 3000,
    host: true, // Listen on all addresses
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  
  // Specify that we're using modules
  resolve: {
    extensions: ['.js', '.json']
  }
});
