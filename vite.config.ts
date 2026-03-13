import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
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
