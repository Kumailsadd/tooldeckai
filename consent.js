// Analytics + consent (disabled until GA_ID is set)
const GA_ID = ""; // Example: 'G-ABC123DEF'. Leave empty to disable banner and GA.

function loadGA() {
  if (!GA_ID) return;
  if (window.gtagLoaded) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, { anonymize_ip: true });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.gtagLoaded = true;
}

function showBanner() {
  if (!GA_ID) return; // Don’t show banner if GA is not configured
  if (localStorage.getItem("consent") === "granted") {
    loadGA();
    return;
  }
  if (localStorage.getItem("consent") === "denied") return;

  const bar = document.createElement("div");
  bar.style.cssText =
    "position:fixed;bottom:0;left:0;right:0;background:#0b1220;color:#fff;padding:10px 14px;display:flex;gap:12px;align-items:center;justify-content:center;z-index:9999;font:14px system-ui,Segoe UI,Roboto;";
  bar.innerHTML = `
    <span>This site uses basic analytics after consent only.</span>
    <button id="consent-accept" style="background:#0ea5e9;color:#fff;border:0;border-radius:8px;padding:6px 10px;cursor:pointer">Accept</button>
    <button id="consent-decline" style="background:#475569;color:#fff;border:0;border-radius:8px;padding:6px 10px;cursor:pointer">Decline</button>
  `;
  document.body.appendChild(bar);
  document.getElementById("consent-accept").onclick = () => {
    localStorage.setItem("consent", "granted");
    bar.remove();
    loadGA();
  };
  document.getElementById("consent-decline").onclick = () => {
    localStorage.setItem("consent", "denied");
    bar.remove();
  };
}

window.addEventListener("load", showBanner);
