"use strict";

const DEFAULTS = {
  enabled: true,
  headerEnabled: true,
  footerEnabled: true,
  headerMode: "fields",
  footerMode: "fields",
  headerSvg: "",
  footerSvg: "",
  companyName: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logoData: "",
  footerLeft: "",
  footerCenter: "",
  footerRight: "",
  showDate: false,
  bgColor: "#ffffff",
  textColor: "#000000",
  borderColor: "#2563eb",
  fontSize: "12",
  fontFamily: "Arial",
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
  $(`${target}Mode`).value = mode;

  // update buttons
  document.querySelectorAll(`.mode-btn[data-target="${target}"]`).forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  // show/hide sections
  if (target === "header") {
    $("headerFieldsSection").style.display = mode === "fields" ? "block" : "none";
    $("headerSvgSection").style.display    = mode === "svg"    ? "block" : "none";
  } else {
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
    $("fontSizeVal").textContent = fontRange.value;
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
  $("bgColorHex").textContent     = s.bgColor;
  $("textColorHex").textContent   = s.textColor;
  $("borderColorHex").textContent = s.borderColor;
  if ($("fontSizeVal")) $("fontSizeVal").textContent = s.fontSize;

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
    footerLeft:    val("footerLeft"),
    footerCenter:  val("footerCenter"),
    footerRight:   val("footerRight"),
    showDate:      chk("showDate", false),
    bgColor:       val("bgColor",     "#ffffff"),
    textColor:     val("textColor",   "#000000"),
    borderColor:   val("borderColor", "#2563eb"),
    fontSize:      val("fontSize",    "12"),
    fontFamily:    val("fontFamily",  "Arial"),
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

/* ── Init ── */
loadSettings();
