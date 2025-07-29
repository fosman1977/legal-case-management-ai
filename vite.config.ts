import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: "./", // Important for Electron
    server: {
        host: '0.0.0.0',
        strictPort: false,
        cors: true,
        allowedHosts: ['hpjp98-8080.csb.app', '.csb.app']
    },
    optimizeDeps: {
        include: ['pdfjs-dist']
    },
    build: {
        rollupOptions: {
            external: [],
            output: {
                manualChunks: {
                    'pdfjs': ['pdfjs-dist']
                }
            }
        }
    }
});
  