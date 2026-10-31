<script lang="ts">
  import { onMount } from "svelte"
  import { getLocale, m } from "$lib/i18n/messages"
  import { sound } from "$lib/sound/sound.svelte"
  import { pwaInfo } from "virtual:pwa-info"
  import "../app.css"

  let { children } = $props()
  const webManifest = pwaInfo?.webManifest

  document.documentElement.lang = getLocale()

  onMount(() => {
    let disposed = false

    async function registerServiceWorker() {
      if (disposed || !pwaInfo || !("serviceWorker" in navigator)) return

      const { registerSW } = await import("virtual:pwa-register")
      if (disposed) return

      registerSW({
        immediate: true,
        onRegisterError(error) {
          console.error("Service worker registration failed", error)
        },
      })
    }

    const onLoad = () => void registerServiceWorker()
    if (document.readyState === "complete") onLoad()
    else window.addEventListener("load", onLoad, { once: true })

    return () => {
      disposed = true
      window.removeEventListener("load", onLoad)
    }
  })
</script>

<svelte:head>
  <title>{m.appName()}</title>
  {#if webManifest}
    <link
      rel="manifest"
      href={webManifest.href}
      crossorigin={webManifest.useCredentials ? "use-credentials" : undefined}
    />
  {/if}
</svelte:head>

<svelte:window
  onpointerup={() => sound.unlock()}
  onkeydown={() => sound.unlock()}
/>

{@render children()}
