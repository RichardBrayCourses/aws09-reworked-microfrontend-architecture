import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "^/gallery(?:/.*)?$": {
        target: "http://localhost:5174",
        changeOrigin: true,
        ws: true,
        rewrite: (routePath) => routePath === "/gallery" ? "/gallery/" : routePath,
      },
      "^/analytics(?:/.*)?$": {
        target: "http://localhost:5175",
        changeOrigin: true,
        ws: true,
        rewrite: (routePath) =>
          routePath === "/analytics" ? "/analytics/" : routePath,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
