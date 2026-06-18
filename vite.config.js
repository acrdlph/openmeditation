import { defineConfig } from "vite";
import { resolve } from "path";

// Multi-page: Dolomites (index.html) + Whales (whales.html) share one project.
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        whales: resolve(__dirname, "whales.html"),
      },
    },
  },
});
