/**
 * Service Worker registration.
 *
 * Loaded as a regular script (not a module) from index.html footer.
 * Respects `?nosw=1` query param for disabling, and surfaces an
 * "update available" indicator if a new SW is waiting.
 */
(function () {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1") return;
  if (new URL(location.href).searchParams.get("nosw") === "1") {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
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
