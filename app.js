// ===== ELEMENTS =====
const input = document.getElementById("url-input");
const goBtn = document.getElementById("go-btn");
const iframe = document.getElementById("proxy-frame");
const homepage = document.getElementById("homepage");
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const engineSelect = document.getElementById("search-engine");
const particlesToggle = document.getElementById("particles-toggle");
const cloakSelect = document.getElementById("cloak-select");
const canvas = document.getElementById("particles");

// ===== SEARCH ENGINES =====
const engines = {
  startpage: q => `https://www.startpage.com/sp/search?q=${q}`,
  duckduckgo: q => `https://duckduckgo.com/?q=${q}`,
  brave: q => `https://search.brave.com/search?q=${q}`,
  google: q => `https://www.google.com/search?q=${q}`
};

engineSelect.value = localStorage.getItem("oblivion:engine") || "startpage";
engineSelect.onchange = () => {
  localStorage.setItem("oblivion:engine", engineSelect.value);
};

// ===== PARTICLES TOGGLE =====
particlesToggle.checked = localStorage.getItem("oblivion:particles") !== "off";
canvas.style.display = particlesToggle.checked ? "block" : "none";
particlesToggle.onchange = () => {
  canvas.style.display = particlesToggle.checked ? "block" : "none";
  localStorage.setItem("oblivion:particles", particlesToggle.checked ? "on" : "off");
};

// ===== CLOAK SYSTEM =====
const cloaks = {
  none: { title: "Oblivion", icon: "/favicon.ico" },
  google: { title: "Untitled document - Google Docs", icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
  classroom: { title: "Classes", icon: "https://ssl.gstatic.com/classroom/favicon.png" },
  drive: { title: "My Drive - Google Drive", icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" },
  canvas: { title: "Dashboard", icon: "https://canvas.instructure.com/favicon.ico" }
};

function applyCloak(name) {
  const cloak = cloaks[name] || cloaks.none;
  document.title = cloak.title;
  let icon = document.querySelector("link[rel='icon']");
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.href = cloak.icon;
  localStorage.setItem("oblivion:cloak", name);
}

cloakSelect.value = localStorage.getItem("oblivion:cloak") || "none";
applyCloak(cloakSelect.value);
cloakSelect.onchange = () => applyCloak(cloakSelect.value);

// ===== SETTINGS PANEL TOGGLE =====
settingsBtn.onclick = () => {
  settingsPanel.style.display =
    settingsPanel.style.display === "block" ? "none" : "block";
};

// ===== NORMALIZE INPUT =====
function normalizeAndDetect(inputValue) {
  let value = inputValue.trim();
  if (/^[\w-]+\.[\w.-]+/.test(value) && !/^https?:\/\//i.test(value)) {
    value = "https://" + value;
  }
  try {
    new URL(value);
    return { type: "url", value };
  } catch {
    return { type: "search", value };
  }
}

// ===== SEARCH / GO =====
goBtn.addEventListener("click", () => {
  const raw = input.value;
  if (!raw) return;

  const detected = normalizeAndDetect(raw);

  let target;
  if (detected.type === "url") {
    target = detected.value;
  } else {
    const engine = engines[engineSelect.value];
    target = engine(encodeURIComponent(detected.value));
  }

  homepage.style.display = "none";
  iframe.style.display = "block";
  iframe.src = `/proxy?url=${encodeURIComponent(target)}`;
});

// Enter key triggers search
input.addEventListener("keydown", e => {
  if (e.key === "Enter") goBtn.click();
});

// Autofocus input on load
window.addEventListener("load", () => input.focus());

// ===== IFRAME LINK REWRITE =====
iframe.addEventListener("load", () => {
  homepage.style.display = "none";
  iframe.style.display = "block";

  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;

    const links = doc.querySelectorAll("a[href]");
    links.forEach(a => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
      a.removeAttribute("target");
      a.href = `/proxy?url=${encodeURIComponent(href)}`;
    });
  } catch {}
});

// ===== PANIC KEY =====
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    iframe.src = "about:blank";
    iframe.style.display = "none";
    homepage.style.display = "flex";
    applyCloak(cloakSelect.value);
  }
});
