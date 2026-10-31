import { sveltekit } from "@sveltejs/kit/vite"
import { SvelteKitPWA } from "@vite-pwa/sveltekit"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      kit: {
        adapterFallback: "index.html",
        spa: true,
      },
      registerType: "autoUpdate",
      manifest: {
        name: "Night Bakery",
        short_name: "Night Bakery",
        description: "A cozy shedding card game about three hot ovens",
        theme_color: "#ffd803",
        background_color: "#fff8ed",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,ico,png,svg,webp,webmanifest}"],
        // The original logo PNGs are source assets, too big to precache.
        globIgnores: ["**/brand/*.png"],
      },
    }),
  ],
})
