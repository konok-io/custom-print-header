"use strict";

const DEFAULTS = {
  enabled: true,
  headerEnabled: true,
  footerEnabled: true,
  headerMode: "fields",
  footerMode: "fields",
  headerSvg: "",
  footerSvg: "",
  companyName: "আপনার প্রতিষ্ঠানের নাম",
  tagline: "আপনার ট্যাগলাইন এখানে আসবে",
  address: "ঢাকা, বাংলাদেশ",
  phone: "+880 1XXX-XXXXXX",
  email: "info@example.com",
  website: "www.example.com",
  logoData: "",
  logoSize: "58",
  footerLeft: "যোগাযোগ: info@example.com",
  footerCenter: "ধন্যবাদ",
  footerRight: "স্বাক্ষর: ____________",
  showDate: true,
  bgColor: "#ffffff",
  textColor: "#000000",
  borderColor: "#2563eb",
  fontSize: "14",
  fontFamily: "StarNews",
  contentOnly: false,
  pageOrientation: "portrait",
  fixRtl: false,
  removeFixed: false,
  printBackground: false,
  forceReload: false,
  // New features
  pageNumbers: true,
  pageNumbersPosition: "footer",
  watermark: "none",
  watermarkText: "",
  watermarkColor: "#000000",
  watermarkOpacity: "0.1",
  presetName: "default",
};

const PRESETS = {
  invoice: {
    name: "📋 ইনভয়েস",
    companyName: "আপনার প্রতিষ্ঠান",
    tagline: "চালান",
    footerLeft: "ইনভয়েস #১২৩৪",
    footerCenter: "ধন্যবাদ",
    footerRight: "মোট: ৳০",
    watermark: "none",
  },
  report: {
    name: "📊 রিপোর্ট",
    companyName: "প্রতিষ্ঠান নাম",
    tagline: "মাসিক রিপোর্ট",
    footerLeft: "গোপনীয়",
    footerCenter: "",
    footerRight: "",
    watermark: "CONFIDENTIAL",
  },
  letter: {
    name: "📝 লেটারহেড",
    companyName: "আপনার নাম/প্রতিষ্ঠান",
    tagline: "যোগাযোগ: +৮৮০-XXXXXXXXX",
    footerLeft: "",
    footerCenter: "",
    footerRight: "",
    watermark: "none",
  },
};

const THEMES = {
  classic: { bgColor: "#ffffff", textColor: "#111111", borderColor: "#333333" },
  blue:    { bgColor: "#eff6ff", textColor: "#1e3a8a", borderColor: "#2563eb" },
  green:   { bgColor: "#f0fdf4", textColor: "#14532d", borderColor: "#16a34a" },
  red:     { bgColor: "#fff1f2", textColor: "#881337", borderColor: "#e11d48" },
  dark:    { bgColor: "#1e293b", textColor: "#f1f5f9", borderColor: "#38bdf8" },
};

let savedLogoData  = "";
let savedHeaderSvg = "";
let savedFooterSvg = "";

const $  = (id) => document.getElementById(id);
const val = (id, fb = "") => $(id) ? $(id).value : fb;
const chk = (id, fb = true)  => $(id) ? $(id).checked : fb;
function setVal(id, v) { if ($(id)) $(id).value = v ?? ""; }
function setChk(id, v) { if ($(id)) $(id).checked = !!v; }

/* ── Tabs ── */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    $(tab.dataset.tab).classList.add("active");
  });
});

/* ── Mode selector (ফিল্ড / SVG) ── */
function setMode(target, mode) {
  // update hidden input
  if (target === "header" || target === "footer") {
    $(`${target}Mode`).value = mode;
  } else if (target === "orientation") {
    $("pageOrientation").value = mode;
  }

  // update buttons
  document.querySelectorAll(`.mode-btn[data-target="${target}"]`).forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  // show/hide sections
  if (target === "header") {
    $("headerFieldsSection").style.display = mode === "fields" ? "block" : "none";
    $("headerSvgSection").style.display    = mode === "svg"    ? "block" : "none";
  } else if (target === "footer") {
    $("footerFieldsSection").style.display = mode === "fields" ? "block" : "none";
    $("footerSvgSection").style.display    = mode === "svg"    ? "block" : "none";
  }
}

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.target, btn.dataset.mode));
});

/* ── Color pickers ── */
function syncColor(colorId, hexId) {
  const el = $(colorId), lbl = $(hexId);
  if (!el || !lbl) return;
  lbl.textContent = el.value;
  el.addEventListener("input", () => { lbl.textContent = el.value; });
}
syncColor("bgColor", "bgColorHex");
syncColor("textColor", "textColorHex");
syncColor("borderColor", "borderColorHex");

/* ── Font size range ── */
const fontRange = $("fontSize");
if (fontRange) {
  fontRange.addEventListener("input", () => {
    const val = fontRange.value;
    if ($("fontSizeVal")) $("fontSizeVal").textContent = val;
    if ($("fontSizeLabel")) $("fontSizeLabel").textContent = val;
  });
}

/* ── Logo upload ── */
$("uploadTrigger")?.addEventListener("click", () => $("logoInput").click());
$("logoInput")?.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    savedLogoData = ev.target.result;
    const img = $("logoPreviewImg");
    img.src = savedLogoData;
    img.style.display = "block";
    $("logoPlaceholder").style.display = "none";
  };
  reader.readAsDataURL(file);
});
$("removeLogo")?.addEventListener("click", () => {
  savedLogoData = "";
  $("logoPreviewImg").src = "";
  $("logoPreviewImg").style.display = "none";
  $("logoPlaceholder").style.display = "block";
  $("logoInput").value = "";
});

/* ── SVG Upload helper ── */
function setupSvgUpload({ dropId, inputId, previewId, actionsId, clearId, nameId, onLoad, onClear }) {
  const drop    = $(dropId);
  const input   = $(inputId);
  const preview = $(previewId);
  const actions = $(actionsId);
  const nameEl  = $(nameId);

  function readSvg(file) {
    if (!file || !file.name.endsWith(".svg")) {
      showStatus("শুধু .svg ফাইল গ্রহণযোগ্য", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const svgText = ev.target.result;
      onLoad(svgText);
      // show preview
      preview.innerHTML = svgText;
      const svg = preview.querySelector("svg");
      if (svg) { svg.setAttribute("width","100%"); svg.removeAttribute("height"); }
      preview.style.display = "block";
      if (actions) actions.style.display = "flex";
      if (nameEl) nameEl.textContent = file.name;
      showStatus("✓ SVG লোড হয়েছে!", "success");
    };
    reader.readAsText(file);
  }

  // click to upload
  if (input) {
    input.addEventListener("change", e => readSvg(e.target.files[0]));
  }

  // drag & drop
  if (drop) {
    drop.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("drag"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("drag"));
    drop.addEventListener("drop", e => {
      e.preventDefault();
      drop.classList.remove("drag");
      readSvg(e.dataTransfer.files[0]);
    });
  }

  // clear
  $(clearId)?.addEventListener("click", () => {
    onClear();
    if (preview) { preview.innerHTML = ""; preview.style.display = "none"; }
    if (actions) actions.style.display = "none";
    if (nameEl)  nameEl.textContent = "";
    if (input)   input.value = "";
    showStatus("SVG সরানো হয়েছে", "success");
  });
}

setupSvgUpload({
  dropId:    "headerSvgDrop",
  inputId:   "headerSvgInput",
  previewId: "headerSvgPreview",
  actionsId: "headerSvgActions",
  clearId:   "clearHeaderSvg",
  nameId:    "headerSvgName",
  onLoad:    svg => { savedHeaderSvg = svg; },
  onClear:   ()  => { savedHeaderSvg = ""; },
});

setupSvgUpload({
  dropId:    "footerSvgDrop",
  inputId:   "footerSvgInput",
  previewId: "footerSvgPreview",
  actionsId: "footerSvgActions",
  clearId:   "clearFooterSvg",
  nameId:    "footerSvgName",
  onLoad:    svg => { savedFooterSvg = svg; },
  onClear:   ()  => { savedFooterSvg = ""; },
});

/* ── Theme presets ── */
document.querySelectorAll(".theme-dot").forEach(dot => {
  dot.addEventListener("click", () => {
    const t = THEMES[dot.dataset.theme];
    if (!t) return;
    setVal("bgColor",     t.bgColor);
    setVal("textColor",   t.textColor);
    setVal("borderColor", t.borderColor);
    $("bgColorHex").textContent     = t.bgColor;
    $("textColorHex").textContent   = t.textColor;
    $("borderColorHex").textContent = t.borderColor;
  });
});

/* ── Restore SVG preview in popup ── */
function restoreSvgPreview(svgText, previewId, actionsId, nameId, fileName) {
  if (!svgText) return;
  const preview = $(previewId);
  const actions = $(actionsId);
  if (preview) {
    preview.innerHTML = svgText;
    const svg = preview.querySelector("svg");
    if (svg) { svg.setAttribute("width","100%"); svg.removeAttribute("height"); }
    preview.style.display = "block";
  }
  if (actions) actions.style.display = "flex";
  if ($(nameId)) $(nameId).textContent = fileName || "design.svg";
}

/* ── Load from storage ── */
function loadSettings() {
  chrome.storage.local.get("printSettings", result => {
    const s = Object.assign({}, DEFAULTS, result.printSettings || {});
    populateForm(s);
  });
}

function populateForm(s) {
  setChk("enableToggle",  s.enabled);
  setChk("headerEnabled", s.headerEnabled);
  setChk("footerEnabled", s.footerEnabled);
  setChk("contentOnly", s.contentOnly);
  setChk("fixRtl", s.fixRtl);
  setChk("removeFixed", s.removeFixed);
  setChk("printBackground", s.printBackground);
  setChk("forceReload", s.forceReload);
  setChk("pageNumbers", s.pageNumbers);
  setChk("watermarkEnabled", s.watermark !== "none");
  setMode("orientation", s.pageOrientation || "portrait");
  setVal("companyName",  s.companyName);
  setVal("tagline",      s.tagline);
  setVal("address",      s.address);
  setVal("phone",        s.phone);
  setVal("email",        s.email);
  setVal("website",      s.website);
  setVal("footerLeft",   s.footerLeft);
  setVal("footerCenter", s.footerCenter);
  setVal("footerRight",  s.footerRight);
  setChk("showDate",     s.showDate);
  setVal("bgColor",      s.bgColor);
  setVal("textColor",    s.textColor);
  setVal("borderColor",  s.borderColor);
  setVal("fontSize",     s.fontSize);
  setVal("fontFamily",   s.fontFamily);
  setVal("logoSize",     s.logoSize || "58");
  $("bgColorHex").textContent     = s.bgColor;
  $("textColorHex").textContent   = s.textColor;
  $("borderColorHex").textContent = s.borderColor;
  if ($("fontSizeVal")) $("fontSizeVal").textContent = s.fontSize;
  if ($("logoSizeVal")) $("logoSizeVal").textContent = s.logoSize || "58";

  // Page numbers
  if ($("pageNumbersPosition")) $("pageNumbersPosition").value = s.pageNumbersPosition || "footer";
  
  // Watermark
  if ($("watermarkType")) $("watermarkType").value = s.watermark || "none";
  if ($("watermarkText")) $("watermarkText").value = s.watermarkText || "";
  if ($("watermarkColor")) $("watermarkColor").value = s.watermarkColor || "#000000";
  if ($("watermarkOpacity")) $("watermarkOpacity").value = s.watermarkOpacity || "0.1";
  $("watermarkColorHex").textContent = s.watermarkColor || "#000000";
  $("watermarkOpacityVal").textContent = ((parseFloat(s.watermarkOpacity || "0.1")) * 100) + "%";

  // Preset
  if ($("presetSelect")) $("presetSelect").value = s.presetName || "default";
  if ($("presetName")) $("presetName").value = s.presetName || "default";

  // logo
  savedLogoData = s.logoData || "";
  if (savedLogoData) {
    const img = $("logoPreviewImg");
    img.src = savedLogoData;
    img.style.display = "block";
    $("logoPlaceholder").style.display = "none";
  }

  // SVG
  savedHeaderSvg = s.headerSvg || "";
  savedFooterSvg = s.footerSvg || "";

  // modes
  setMode("header", s.headerMode || "fields");
  setMode("footer", s.footerMode || "fields");

  // restore SVG previews
  if (savedHeaderSvg) restoreSvgPreview(savedHeaderSvg, "headerSvgPreview", "headerSvgActions", "headerSvgName", "header.svg");
  if (savedFooterSvg) restoreSvgPreview(savedFooterSvg, "footerSvgPreview", "footerSvgActions", "footerSvgName", "footer.svg");
}

/* ── Collect form values ── */
function getSettings() {
  return {
    enabled:       chk("enableToggle"),
    headerEnabled: chk("headerEnabled"),
    footerEnabled: chk("footerEnabled"),
    contentOnly:    chk("contentOnly"),
    pageOrientation: val("pageOrientation", "portrait"),
    fixRtl:        chk("fixRtl"),
    removeFixed:   chk("removeFixed"),
    printBackground: chk("printBackground"),
    forceReload:   chk("forceReload"),
    headerMode:    val("headerMode", "fields"),
    footerMode:    val("footerMode", "fields"),
    headerSvg:     savedHeaderSvg,
    footerSvg:     savedFooterSvg,
    companyName:   val("companyName"),
    tagline:       val("tagline"),
    address:       val("address"),
    phone:         val("phone"),
    email:         val("email"),
    website:       val("website"),
    logoData:      savedLogoData,
    logoSize:      val("logoSize", "58"),
    footerLeft:    val("footerLeft"),
    footerCenter:  val("footerCenter"),
    footerRight:   val("footerRight"),
    showDate:      chk("showDate", false),
    bgColor:       val("bgColor",     "#ffffff"),
    textColor:     val("textColor",   "#000000"),
    borderColor:   val("borderColor", "#2563eb"),
    fontSize:      val("fontSize",    "14"),
    fontFamily:    val("fontFamily",  "Arial"),
    // New features
    pageNumbers: chk("pageNumbers"),
    pageNumbersPosition: val("pageNumbersPosition", "footer"),
    watermark: val("watermarkType", "none"),
    watermarkText: val("watermarkText"),
    watermarkColor: val("watermarkColor", "#000000"),
    watermarkOpacity: val("watermarkOpacity", "0.1"),
    presetName: val("presetName", "default"),
  };
}

/* ── Save ── */
$("saveBtn")?.addEventListener("click", () => {
  const settings = getSettings();

  // validation: SVG mode কিন্তু SVG নেই
  if (settings.headerMode === "svg" && !settings.headerSvg) {
    showStatus("হেডার SVG আপলোড করুন অথবা ফিল্ড মোড বেছে নিন", "error");
    return;
  }
  if (settings.footerMode === "svg" && !settings.footerSvg) {
    showStatus("ফুটার SVG আপলোড করুন অথবা ফিল্ড মোড বেছে নিন", "error");
    return;
  }

  chrome.storage.local.set({ printSettings: settings }, () => {
    showStatus("✓ সেটিংস সেভ হয়েছে!", "success");
  });
});

/* ── Reset ── */
$("resetBtn")?.addEventListener("click", () => {
  if (!confirm("সব সেটিংস মুছে ডিফল্টে ফিরে যাবে?")) return;
  savedLogoData = ""; savedHeaderSvg = ""; savedFooterSvg = "";
  chrome.storage.local.remove("printSettings", () => {
    populateForm(DEFAULTS);
    ["headerSvgPreview","footerSvgPreview"].forEach(id => {
      if ($(id)) { $(id).innerHTML = ""; $(id).style.display = "none"; }
    });
    ["headerSvgActions","footerSvgActions"].forEach(id => {
      if ($(id)) $(id).style.display = "none";
    });
    showStatus("↺ রিসেট সম্পন্ন", "success");
  });
});

/* ── Status ── */
function showStatus(msg, type = "success") {
  const el = $("statusMsg");
  if (!el) return;
  el.textContent = msg;
  el.className = `status ${type}`;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3000);
}

/* ── Preset System ── */
function loadPreset(presetKey) {
  if (presetKey === "default") {
    chrome.storage.local.get("printSettings", result => {
      if (result.printSettings) {
        populateForm(result.printSettings);
        showStatus("✓ ডিফল্ট সেটিংস লোড হয়েছে", "success");
      }
    });
    return;
  }
  
  const preset = PRESETS[presetKey];
  if (!preset) return;
  
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...preset, presetName: presetKey };
  populateForm(newSettings);
  showStatus(`✓ ${preset.name} প্রিসেট লোড হয়েছে!`, "success");
}

function saveAsPreset() {
  const name = prompt("প্রিসেটের নাম দিন:");
  if (!name) return;
  
  chrome.storage.local.get("customPresets", result => {
    const presets = result.customPresets || {};
    presets[name] = getSettings();
    presets[name].presetName = name;
    chrome.storage.local.set({ customPresets: presets }, () => {
      showStatus(`✓ "${name}" প্রিসেট সেভ হয়েছে!`, "success");
      updatePresetDropdown();
    });
  });
}

function updatePresetDropdown() {
  const select = $("presetSelect");
  if (!select) return;
  
  chrome.storage.local.get("customPresets", result => {
    const customPresets = result.customPresets || {};
    const options = select.querySelectorAll("option[data-custom]");
    options.forEach(o => o.remove());
    
    Object.keys(customPresets).forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = "📁 " + name;
      option.setAttribute("data-custom", "true");
      select.appendChild(option);
    });
  });
}

/* ── Export / Import Settings ── */
function exportSettings() {
  const settings = getSettings();
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `print-settings-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showStatus("✓ সেটিংস এক্সপোর্ট হয়েছে!", "success");
}

function importSettings() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const settings = JSON.parse(ev.target.result);
        chrome.storage.local.set({ printSettings: settings }, () => {
          populateForm(settings);
          showStatus("✓ সেটিংস ইমপোর্ট হয়েছে!", "success");
        });
      } catch (err) {
        showStatus("❌ ফাইল পড়তে সমস্যা হয়েছে", "error");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ── Direct PDF Export ── */
function exportToPDF() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]) return;
    
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        window.print();
      }
    });
  });
}

/* ── Live Preview ── */
function showPreview() {
  const previewWindow = window.open("", "preview", "width=600,height=800");
  const settings = getSettings();
  const html = generatePreviewHTML(settings);
  previewWindow.document.write(html);
  previewWindow.document.close();
}

function generatePreviewHTML(s) {
  const fs = parseInt(s.fontSize) || 14;
  const logoSize = parseInt(s.logoSize) || 58;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>প্রিন্ট প্রিভিউ</title>
      <style>
        @font-face {
          font-family: 'Bangla'; src: url('fonts/bangla.ttf'); font-display: swap;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Bangla', sans-serif; background: #e5e7eb; padding: 20px; }
        .paper { 
          background: white; width: 210mm; min-height: 297mm; 
          margin: 0 auto; padding: 20mm; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          position: relative;
        }
        .header {
          border-bottom: 2px solid ${s.borderColor};
          padding-bottom: 10px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 15px;
        }
        .logo { height: ${logoSize}px; width: auto; }
        .company-info h2 { font-size: ${fs + 4}px; color: ${s.textColor}; }
        .company-info p { font-size: ${fs}px; color: ${s.textColor}; opacity: 0.7; }
        .content { font-size: ${fs}px; color: ${s.textColor}; line-height: 1.8; }
        .content p { margin-bottom: 15px; }
        .footer {
          border-top: 1px solid ${s.borderColor};
          padding-top: 10px; margin-top: 20px;
          display: flex; justify-content: space-between; font-size: ${fs - 1}px;
        }
        ${s.watermark !== "none" ? `
        .watermark {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px; color: ${s.watermarkColor || "#000"}; opacity: ${parseFloat(s.watermarkOpacity) || 0.1};
          pointer-events: none; z-index: 10;
        }
        ` : ""}
        @media print { body { background: none; padding: 0; } .paper { box-shadow: none; } }
      </style>
    </head>
    <body>
      <div class="paper" style="background: ${s.bgColor}">
        ${s.watermark !== "none" ? `<div class="watermark">${s.watermark === "custom" ? s.watermarkText : s.watermark}</div>` : ""}
        <div class="header">
          ${s.logoData ? `<img src="${s.logoData}" class="logo">` : ""}
          <div class="company-info">
            <h2>${s.companyName || "কোম্পানির নাম"}</h2>
            <p>${s.tagline || "ট্যাগলাইন"}</p>
          </div>
        </div>
        <div class="content">
          <p>এখানে আপনার মূল কন্টেন্ট আসবে...</p>
          <p>বিন মিশাল প্রিন্ট লেআউট এক্সটেনশন দিয়ে আপনি যেকোনো ওয়েবপেজ প্রিন্ট করার সময় কাস্টম হেডার ও ফুটার যোগ করতে পারবেন।</p>
        </div>
        <div class="footer">
          <span>${s.footerLeft || ""}</span>
          <span>${s.footerCenter || ""}</span>
          <span>${s.footerRight || ""}</span>
        </div>
      </div>
    </body>
    </html>
  `;
}

/* ── Event Listeners for New Features ── */

// Preset dropdown
$("presetSelect")?.addEventListener("change", e => loadPreset(e.target.value));

// Load preset buttons
document.querySelectorAll(".preset-load-btn").forEach(btn => {
  btn?.addEventListener("click", () => loadPreset(btn.dataset.preset));
});

// Save preset button
$("savePresetBtn")?.addEventListener("click", saveAsPreset);

// Export/Import
$("exportBtn")?.addEventListener("click", exportSettings);
$("importBtn")?.addEventListener("click", importSettings);

// PDF Export
$("pdfExportBtn")?.addEventListener("click", exportToPDF);

// Live Preview
$("previewBtn")?.addEventListener("click", showPreview);

// Logo size slider
$("logoSize")?.addEventListener("input", e => {
  if ($("logoSizeVal")) $("logoSizeVal").textContent = e.target.value;
});

// Watermark type change
$("watermarkType")?.addEventListener("change", e => {
  const customSection = $("watermarkCustomSection");
  if (customSection) {
    customSection.style.display = e.target.value === "custom" ? "block" : "none";
  }
});

// Watermark color/opacity
syncColor("watermarkColor", "watermarkColorHex");
$("watermarkOpacity")?.addEventListener("input", e => {
  if ($("watermarkOpacityVal")) {
    $("watermarkOpacityVal").textContent = (parseFloat(e.target.value) * 100) + "%";
  }
});

// Init
updatePresetDropdown();
loadSettings();
