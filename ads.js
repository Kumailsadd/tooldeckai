const MONETAG_SRC = ""; // e.g., 'https://example.monetag.co/a/your-code.js'
const ADSENSE_CLIENT = ""; // e.g., 'ca-pub-1234567890123456'
const ADSENSE_SLOT = ""; // optional

function insertScript(src, attrs = {}) {
  const s = document.createElement("script");
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.body.appendChild(s);
}

function loadMonetag() {
  if (!MONETAG_SRC) return;
  insertScript(MONETAG_SRC, { async: "" });
}

function loadAdSense() {
  if (!ADSENSE_CLIENT) return;
  insertScript(
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
    { async: "", crossorigin: "anonymous" }
  );
  document.querySelectorAll(".adsense-box").forEach((box) => {
    const ins = document.createElement("ins");
    ins.className = "adsbygoogle";
    ins.style.cssText = "display:block";
    ins.setAttribute("data-ad-client", ADSENSE_CLIENT);
    if (ADSENSE_SLOT) ins.setAttribute("data-ad-slot", ADSENSE_SLOT);
    ins.setAttribute("data-ad-format", "auto");
    ins.setAttribute("data-full-width-responsive", "true");
    box.innerHTML = "";
    box.appendChild(ins);
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
}

window.addEventListener("load", () => {
  loadMonetag();
  loadAdSense();
});
