import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  server: {
    port: 3000,
    allowedHosts: true,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    tailwindcss(),
    viteReact(),
  ],
});
