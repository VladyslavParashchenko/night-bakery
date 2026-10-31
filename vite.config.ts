import { sveltekit } from "@sveltejs/kit/vite"
import { SvelteKitPWA } from "@vite-pwa/sveltekit"
import { readFileSync } from "node:fs"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

const { version } = JSON.parse(readFileSync("package.json", "utf8"))

export default defineConfig({
  // peerjs is only imported dynamically, so Vite would discover it late and
  // re-optimise mid-session, breaking the already loaded page.
  optimizeDeps: {
    include: ["peerjs"],
  },
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
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
            src: "/icons/night-bakery-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/night-bakery.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
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
