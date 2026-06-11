export default {
  build: {
    outDir: 'dist',
    assetsDir: './',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    chunkSizeWarningLimit: 500,
    minify: 'esbuild',
    target: 'es2020',
    reportCompressedSize: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    sourcemap: false
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    cors: {
      origin: '*'
    }
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src'
    },
    extensions: ['.mjs', '.js', '.json']
  },
  envPrefix: 'VITE_',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
}