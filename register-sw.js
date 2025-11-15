(function () {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    const manifest = document.querySelector('link[rel="manifest"]');
    const swUrl = manifest
      ? new URL("sw.js", manifest.href).pathname
      : "/sw.js";
    navigator.serviceWorker.register(swUrl).catch(console.error);
  });
})();
