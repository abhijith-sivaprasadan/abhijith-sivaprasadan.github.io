/**
 * Service Worker registration.
 *
 * Loaded as a regular script (not a module) on public portfolio pages.
 * Service workers are disabled on local previews unless explicitly enabled
 * with `?sw=1`, so editing cannot be hidden behind a stale cache.
 * `?nosw=1` always unregisters existing service workers.
 */
(function () {
  if (!("serviceWorker" in navigator)) return;
  const params = new URL(location.href).searchParams;
  const isLocal = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(location.hostname);
  const scriptUrl = document.currentScript?.src ? new URL(document.currentScript.src) : null;
  const assetVersion = scriptUrl?.searchParams.get("v") || "20260601-field-radar";
  if (location.protocol !== "https:" && !isLocal) return;

  if (params.get("nosw") === "1" || (isLocal && params.get("sw") !== "1")) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
    if (isLocal && "caches" in window) {
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => /^(shell|runtime)-/.test(key)).map((key) => caches.delete(key)))
      );
    }
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(assetVersion)}`, { updateViaCache: "none" }).then((reg) => {
      reg.update().catch(() => {});
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            console.info("[sw] update available — reload to apply");
            window.dispatchEvent(new CustomEvent("portfolio:sw-update-available"));
          }
        });
      });
    }).catch((err) => {
      console.warn("[sw] registration failed:", err);
    });
  });
})();
