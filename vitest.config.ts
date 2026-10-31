import { fileURLToPath } from "node:url"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import { defineConfig } from "vitest/config"

export default defineConfig({
  // Compiles runes in .svelte.ts modules such as the game store.
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
})
