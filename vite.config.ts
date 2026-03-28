import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "masked-icon.svg"],
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: false,
        maximumFileSizeToCacheInBytes: 512 * 1024, // Increased to 512KB to avoid Workbox build failures.
        runtimeCaching: [],
        globIgnores: [
          "**/*.map",
          "**/assets/vendor-*.js",
        ],
      },
      manifest: {
        name: "Receitas do Bell",
        short_name: "Receitas Bell",
        description: "Receitas caseiras testadas e aprovadas",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/pwa/entry",
        scope: "/pwa/",
        icons: [
          {
            src: "/pwa/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/pwa/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/pwa/icons/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/pwa/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: mode === "production"
    ? {
      drop: ["console", "debugger"],
    }
    : undefined,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("recharts") || id.includes("/d3-")) return "charts-vendor";
          if (id.includes("html2canvas")) return "export-vendor";
          if (id.includes("react-day-picker") || id.includes("date-fns")) return "date-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (id.includes("@tanstack/react-table")) return "table-vendor";
          if (id.includes("react-router") || id.includes("@remix-run")) return "router-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";

          return "vendor";
        },
      },
    },
  },
}));
