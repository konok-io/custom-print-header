(function () {
  "use strict";

  const HEADER_ID  = "__cphf_header__";
  const FOOTER_ID  = "__cphf_footer__";
  const STYLE_ID   = "__cphf_style__";
  const FONT_ID    = "__cphf_font__";

  const DEFAULTS = {
    enabled:        true,
    headerEnabled:  true,
    footerEnabled:  true,
    headerMode:     "fields",
    footerMode:     "fields",
    headerSvg:      "",
    footerSvg:      "",
    companyName:    "",
    tagline:        "",
    address:        "",
    phone:          "",
    email:          "",
    website:        "",
    logoData:       "",
    logoSize:       "58",
    footerLeft:     "",
    footerCenter:   "",
    footerRight:    "",
    showDate:       false,
    bgColor:        "#ffffff",
    textColor:      "#000000",
    borderColor:    "#2563eb",
    fontSize:       "14",
    fontFamily:     "StarNews",
    contentOnly:    false,
    pageOrientation: "portrait",
    fixRtl:        false,
    removeFixed:   false,
    printBackground: false,
    forceReload:   false,
    pageNumbers:   false,
    pageNumbersPosition: "footer",
    watermark:     "none",
    watermarkText:  "",
    watermarkColor: "#000000",
    watermarkOpacity: "0.1",
  };

  /* ── এলিমেন্ট সরানো ── */
  function removeElements() {
    [HEADER_ID, FOOTER_ID, STYLE_ID, FONT_ID, "__cphf_page_num__", "__cphf_watermark__"].forEach(id => {
      document.getElementById(id)?.remove();
    });
  }

  /* ── RTL → LTR ডাইরেকশন ঠিক করা ── */
  function fixRtlDirection(enable) {
    if (enable) {
      // html/body এর dir অ্যাট্রিবিউট পরিবর্তন (inline style সহ)
      document.documentElement.setAttribute("dir", "ltr");
      document.body.setAttribute("dir", "ltr");
      document.documentElement.style.setProperty("direction", "ltr", "important");
      document.documentElement.style.setProperty("text-align", "left", "important");
      document.body.style.setProperty("direction", "ltr", "important");
      document.body.style.setProperty("text-align", "left", "important");
      
      // সব RTL এলিমেন্ট খুঁজে dir পরিবর্তন
      document.querySelectorAll("[dir='rtl']").forEach(el => {
        el.setAttribute("dir", "ltr");
        el.style.setProperty("direction", "ltr", "important");
        el.style.setProperty("text-align", "left", "important");
      });
      
      // RTL ক্লাস খুঁজে LTR ক্লাসে পরিবর্তন
      document.querySelectorAll("[class*='rtl'], [class*='RTL'], .rtl, .RTL").forEach(el => {
        let cls = el.className;
        if (typeof cls === 'string') {
          cls = cls.replace(/rtl/gi, 'ltr');
          el.className = cls;
        }
        el.style.setProperty("direction", "ltr", "important");
        el.style.setProperty("text-align", "left", "important");
      });
      
      // আরবি ফন্ট প্রতিস্থাপন (যদি থাকে)
      document.querySelectorAll("*").forEach(el => {
        const fontFamily = window.getComputedStyle(el).fontFamily;
        if (fontFamily && (fontFamily.includes("Arabic") || fontFamily.includes("Traditional Arabic") || 
            fontFamily.includes("Amiri") || fontFamily.includes("Noto Sans Arabic"))) {
          el.style.setProperty("font-family", "Arial, sans-serif", "important");
        }
      });
      
      // MutationObserver দিয়ে নতুন RTL এলিমেন্ট ট্র্যাক করা
      if (!window.__cphf_rtl_observer) {
        window.__cphf_rtl_observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                if (node.getAttribute && node.getAttribute("dir") === "rtl") {
                  node.setAttribute("dir", "ltr");
                }
                // নতুন যুক্ত এলিমেন্টের জন্যও চেক
                if (node.querySelectorAll) {
                  node.querySelectorAll("[dir='rtl']").forEach(el => {
                    el.setAttribute("dir", "ltr");
                  });
                }
              }
            });
          });
        });
        window.__cphf_rtl_observer.observe(document.body, { 
          childList: true, 
          subtree: true
        });
      }
      
      // সব inline style ট্র্যাক করার জন্য attribute observer
      if (!window.__cphf_style_observer) {
        window.__cphf_style_observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
              const el = mutation.target;
              if (el.getAttribute && el.getAttribute("dir") === "rtl") {
                el.setAttribute("dir", "ltr");
              }
            }
          });
        });
        window.__cphf_style_observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["style", "dir"],
          subtree: true
        });
      }
    } else {
      // RTL observer বন্ধ করা
      if (window.__cphf_rtl_observer) {
        window.__cphf_rtl_observer.disconnect();
        window.__cphf_rtl_observer = null;
      }
      if (window.__cphf_style_observer) {
        window.__cphf_style_observer.disconnect();
        window.__cphf_style_observer = null;
      }
    }
  }

  /* ── SVG থেকে margin বের করা ── */
  function getSvgMargin(svgStr, fallback) {
    try {
      const m = svgStr.match(/viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i);
      if (m) {
        const scaled = Math.round((parseFloat(m[2]) / parseFloat(m[1])) * 680);
        return Math.min(Math.max(scaled + 20, 50), 240) + "px";
      }
      const hm = svgStr.match(/\bheight=["']([\d.]+)/i);
      if (hm) return (parseFloat(hm[1]) + 20) + "px";
    } catch (_) {}
    return fallback;
  }

  /* ── SVG কে রেসপন্সিভ করা ── */
  function normalizeSvg(container) {
    const svg = container.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("width", "100%");
    svg.style.display = "block";
    svg.style.maxWidth = "100%";
    if (!svg.getAttribute("viewBox") && svg.getAttribute("height")) {
      svg.setAttribute("viewBox",
        `0 0 ${svg.getAttribute("width") || 680} ${svg.getAttribute("height")}`);
    }
    svg.removeAttribute("height");
  }

  /* ── মূল ইনজেকশন ── */
  function injectElements(s) {
    removeElements();
    if (!s.enabled) return;

    const fs         = parseInt(s.fontSize) || 12;
    const hShow      = s.headerEnabled !== false;
    const fShow      = s.footerEnabled !== false;
    const svgHeader  = hShow && s.headerMode === "svg" && s.headerSvg;
    const svgFooter  = fShow && s.footerMode === "svg" && s.footerSvg;
    const hMargin    = hShow ? (svgHeader ? getSvgMargin(s.headerSvg, "130px") : "100px") : "15px";
    const fMargin    = fShow ? (svgFooter ? getSvgMargin(s.footerSvg, "65px")  : "60px")  : "15px";

    /* ── ১. বাংলা ফন্ট লোড ── */
    const fontUrl = chrome.runtime.getURL("fonts/bangla.ttf");
    const fontStyle = document.createElement("style");
    fontStyle.id = FONT_ID;
    fontStyle.textContent = `
      @font-face {
        font-family: 'StarNews';
        src: url('${fontUrl}') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(fontStyle);

    /* ── ২. প্রিন্ট CSS ── */
    const usedFont = `'StarNews', '${s.fontFamily || "Arial"}', sans-serif`;
    const isLandscape = s.pageOrientation === "landscape";
    const logoSize = parseInt(s.logoSize) || 58;
    const watermarkOpacity = parseFloat(s.watermarkOpacity) || 0.1;
    const watermarkText = s.watermark === "custom" ? s.watermarkText : s.watermark;
    const wmColor = s.watermarkColor || "#000000";

    /* ── ২.১. RTL ঠিক করা ── */
    let rtlScreenCSS = "";
    if (s.fixRtl) {
      rtlScreenCSS = `
        /* স্ক্রিন ও প্রিন্ট উভয়ে RTL ঠিক করা */
        html, body,
        html[dir="rtl"], body[dir="rtl"] { 
          direction: ltr !important; 
          text-align: left !important; 
        }
        [dir="rtl"], .rtl, [class*="rtl"], [class*="RTL"],
        [data-dir="rtl"], [data-rtl], [data-direction="rtl"] { 
          direction: ltr !important; 
          text-align: left !important; 
        }
        table, thead, tbody, tr, th, td { 
          direction: ltr !important; 
          text-align: left !important; 
        }
        /* RTL-specific positioning fixes */
        .ms-rtl, [style*="right"], [style*="float: right"] { 
          float: left !important; 
        }
        /* Margin/Padding adjustments for RTL→LTR */
        [style*="margin-right"], [style*="margin-left"] { 
          margin-left: inherit !important; 
        }
        /* Main container adjustments */
        #masterPage, #mainContent, .main-container, 
        .container, .content-wrapper, #content {
          direction: ltr !important;
          text-align: left !important;
        }
        * { 
          direction: ltr !important; 
          unicode-bidi: plaintext !important; 
        }
      `;
    }

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = rtlScreenCSS + `
      #${HEADER_ID}, #${FOOTER_ID}, #__cphf_page_num__, #__cphf_watermark__ { display: none !important; }

      @media print {
        /* CSS counter for page numbers */
        @page { counter-increment: page; }
        body { counter-reset: page; }

        @page {
          size: A4 ${s.pageOrientation || "portrait"};
          margin: 10mm;
        }

        /* পুরো পেজ প্রস্থ 100% - কোন কাটা নয় */
        html, body {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* সব কন্টেইনার পূর্ণ প্রস্থ */
        *, *::before, *::after {
          box-sizing: border-box !important;
        }
        
        .container, .container-fluid, .container-sm, .container-md, .container-lg, .container-xl,
        .wrapper, .main-wrapper, .page-wrapper, .content-wrapper, .site-content,
        #main, #content, #main-content, .main-content, main,
        .row, form, fieldset {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 100% !important;
          flex-basis: 100% !important;
        }

        /* টেবিল পূর্ণ প্রস্থ */
        table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: auto !important;
          overflow: visible !important;
        }
        table, thead, tbody, tr, th, td {
          page-break-inside: avoid !important;
        }
        td, th {
          width: auto !important;
          white-space: normal !important;
        }

        /* সব সেকশন দৃশ্যমান */
        section, article, div, aside, figure, figcaption {
          width: 100% !important;
          max-width: 100% !important;
          overflow: visible !important;
          page-break-inside: avoid !important;
        }

        /* মোবাইল হাইডেন সব দেখাবে */
        .hidden-xs, .hidden-sm, .hidden-md, .hidden-lg, .hidden-print,
        .d-none, .d-sm-none, .d-md-none, .d-lg-none,
        [class*="d-none"], [class*="hidden-"],
        .invisible, .collapse:not(.show) {
          display: block !important;
          visibility: visible !important;
          width: 100% !important;
          overflow: visible !important;
        }

        /* মোবাইল মেনু লুকাবে */
        .navbar-toggle, .hamburger, .menu-toggle, .mobile-menu, .nav-toggle,
        .offcanvas, .sidebar-toggle, .drawer, .mobile-nav, [class*="mobile-"],
        .navbar-collapse, .nav-collapse {
          display: none !important;
        }

        /* ইনপুট/এলিমেন্ট সাইজ */
        input, select, textarea, button, img, svg {
          max-width: none !important;
          width: auto !important;
          height: auto !important;
        }
        
        /* ছবি পূর্ণ প্রস্থ */
        img, svg {
          max-width: 100% !important;
          page-break-inside: avoid !important;
        }

        /* লিস্ট সব দেখাবে */
        ul, ol {
          width: 100% !important;
        }
        li {
          page-break-inside: avoid !important;
        }

        /* Chrome সামঞ্জস্যতা */
        html {
          overflow: visible !important;
        }
      }

      /* ──── ০. ওয়েবসাইটের মূল হেডার/ফুটার লুকান (সবসময়) ──── */
      /* ওয়েবসাইটের নিজস্ব হেডার/ফুটার প্রিন্টে দেখাবে না */
      @media print {
        /* মূল হেডার এলিমেন্ট */
        header, .header, .site-header, .page-header, .main-header,
        .top-header, #header, .header-area, .header-wrap,
        .page-title-bar, .title-bar, .site-branding,
        nav, .navbar, .nav, .navigation, .main-nav, .top-nav,
        .navbar-collapse, .navbar-default, .navbar-fixed-top,
        
        /* মূল ফুটার এলিমেন্ট */
        footer, .footer, .site-footer, .page-footer, #footer,
        .footer-area, .footer-wrap, .copyright, .site-info,
        .footer-content, .footer-section,
        
        /* হেডার/ফুটার সদৃশ */
        [role="banner"], [role="contentinfo"],
        .header-wrapper, .footer-wrapper,
        .site-header-wrap, .site-footer-wrap,
        .page-header-wrap, .page-footer-wrap {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
        }
      }

      /* ──── ১. শুধু নেভিগেশন/বিজ্ঞাপন লুকান ──── */
        ${s.contentOnly ? `
          /* শুধু বিজ্ঞাপন ও নোটিফিকেশন */
          .advertisement, .ad, .ads, .promo, .promotion, .advert, .promotional,
          .promo-banner, .banner, .sponsor, .adsbygoogle, .ads-container,
          [class*="ad-"], [class*="ads-"], [id*="ad-"], [id*="ads-"],
          .cookie-banner, .cookie-notice, .cookie-popup,
          .notification, .toast, .snackbar, .alert-banner {
            display: none !important;
          }
        ` : ""}

        /* ──── ২. Fixed এলিমেন্ট সরান ──── */
        ${s.removeFixed ? `
          * {
            position: relative !important;
            overflow: visible !important;
          }
          [style*="position: fixed"], [style*="position:fixed"],
          [class*="fixed"], [id*="fixed"] {
            position: absolute !important;
          }
          header, nav, .navbar, .header, .topbar, .toolbar {
            position: relative !important;
          }
          /* Chrome overflow সমস্যা */
          html, body {
            overflow: visible !important;
          }
        ` : ""}

        /* ──── ৩. সব ওয়েবসাইটে LTR ফোর্স ──── */
        ${s.fixRtl ? `
          /* Chrome সামঞ্জস্যতা */
          * { box-sizing: border-box !important; }
          
          /* সব RTL এলিমেন্ট LTR করা */
          html[dir="rtl"], body[dir="rtl"], [dir="rtl"] {
            direction: ltr !important;
            text-align: left !important;
          }
          
          /* RTL ক্লাস থাকলেও LTR */
          .rtl, [class*="rtl"], [class*="right"], [class*="arabic"] {
            direction: ltr !important;
            text-align: left !important;
          }
          
          /* প্রিন্টে মার্জিন ঠিক করা */
          html[dir="rtl"], body[dir="rtl"] {
            margin-right: 0 !important;
            padding-right: 0 !important;
          }
          
          /* টেবিল ও ফর্ম প্রস্থ ঠিক করা */
          table, thead, tbody, tr, th, td, input, select, textarea {
            max-width: none !important;
            min-width: 0 !important;
          }
        ` : ""}

        /* ──── ৪. ব্যাকগ্রাউন্ড প্রিন্ট ──── */
        ${s.printBackground ? `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        ` : ""}

        /* ──── ৫. ওয়াটারমার্ক ──── */
        ${s.watermark !== "none" && watermarkText ? `
          #__cphf_watermark__ {
            display: block !important;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            font-weight: bold;
            font-family: ${usedFont};
            color: ${wmColor};
            opacity: ${watermarkOpacity};
            pointer-events: none;
            z-index: 999999;
            white-space: nowrap;
            text-transform: uppercase;
          }
        ` : ""}

        /* ──── ৬. পেজ নম্বর ──── */
        ${s.pageNumbers ? `
          #__cphf_page_num__ {
            display: block !important;
            position: fixed;
            ${s.pageNumbersPosition === "header" ? "top: 8px;" : "bottom: 8px;"}
            right: 15mm;
            font-family: ${usedFont};
            font-size: ${fs}px;
            color: ${s.textColor || "#000"};
            z-index: 2147483646;
          }
          #__cphf_page_num__::before {
            content: "পেজ " counter(page);
          }
        ` : ""}

        /* ──── হেডার (শুধু প্রিন্টে দেখাবে) ──── */
        #${HEADER_ID} {
          display: none !important;
          ${svgHeader ? "padding: 0;" : `
            color: ${s.textColor || "#000"};
            border-bottom: 2.5px solid ${s.borderColor || "#2563eb"};
            padding: 8px 20px;
            display: flex !important;
            align-items: center;
            gap: 14px;
            font-family: ${usedFont};
            font-size: ${fs}px;
          `}
        }

        ${!svgHeader ? `
          #${HEADER_ID} .cphf-logo  { height: ${logoSize}px; width: auto; object-fit: contain; flex-shrink: 0; }
          #${HEADER_ID} .cphf-div   { width: 2px; height: 54px; background: ${s.borderColor || "#2563eb"}; opacity: .4; flex-shrink: 0; }
          #${HEADER_ID} .cphf-info  { flex: 1; min-width: 0; font-family: ${usedFont}; direction: ltr !important; }
          #${HEADER_ID} .cphf-name  { font-family: ${usedFont}; font-size: ${fs + 4}px; font-weight: 700; margin: 0 0 2px; direction: ltr !important; }
          #${HEADER_ID} .cphf-tag   { font-family: ${usedFont}; font-size: ${fs}px; margin: 0 0 3px; opacity: .78; direction: ltr !important; }
          #${HEADER_ID} .cphf-det   { font-family: ${usedFont}; font-size: ${fs - 1}px; margin: 0; opacity: .7; direction: ltr !important; }
        ` : `#${HEADER_ID} svg { width: 100%; height: auto; display: block; }`}

        /* ──── ফুটার (শুধু প্রিন্টে দেখাবে) ──── */
        #${FOOTER_ID} {
          display: none !important;
          ${svgFooter ? "padding: 0;" : `
            color: ${s.textColor || "#555"};
            border-top: 1.5px solid ${s.borderColor || "#2563eb"};
            padding: 5px 20px;
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            font-family: ${usedFont};
            font-size: ${fs - 1}px;
          `}
        }

        ${!svgFooter ? `#${FOOTER_ID} span { max-width: 33%; word-break: break-word; font-family: ${usedFont}; direction: ltr !important; }` : `#${FOOTER_ID} svg { width: 100%; height: auto; display: block; }`}

        /* ──── প্রিন্টে হেডার/ফুটার দেখাবে ──── */
        @media print {
          #${HEADER_ID} {
            display: ${hShow ? "block" : "none"} !important;
            position: fixed;
            top: 0; left: 0; right: 0;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            z-index: 2147483647;
            background: ${s.bgColor || "#fff"};
            box-sizing: border-box !important;
            direction: ltr !important;
            text-align: left !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: visible !important;
          }
          #${FOOTER_ID} {
            display: ${fShow ? "block" : "none"} !important;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
            z-index: 2147483647;
            background: ${s.bgColor || "#fff"};
            box-sizing: border-box !important;
            direction: ltr !important;
            text-align: left !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: visible !important;
          }
        }
      }
    `;
    document.head.appendChild(style);

    /* ── ৩. হেডার তৈরি ── */
    if (hShow) {
      const header = document.createElement("div");
      header.id = HEADER_ID;

      if (svgHeader) {
        header.innerHTML = s.headerSvg;
        normalizeSvg(header);
      } else {
        let html = "";
        if (s.logoData) {
          html += `<img class="cphf-logo" src="${s.logoData}" alt=""><div class="cphf-div"></div>`;
        }
        let info = "";
        if (s.companyName) info += `<p class="cphf-name">${s.companyName}</p>`;
        if (s.tagline)     info += `<p class="cphf-tag">${s.tagline}</p>`;
        const d = [];
        if (s.address) d.push(s.address);
        if (s.phone)   d.push(`☎ ${s.phone}`);
        if (s.email)   d.push(`✉ ${s.email}`);
        if (s.website) d.push(`🌐 ${s.website}`);
        if (d.length)  info += `<p class="cphf-det">${d.join(" &nbsp;|&nbsp; ")}</p>`;
        if (info)      html += `<div class="cphf-info">${info}</div>`;
        header.innerHTML = html;
      }
      document.body.appendChild(header);
    }

    /* ── ৪. ফুটার তৈরি ── */
    if (fShow) {
      const footer = document.createElement("div");
      footer.id = FOOTER_ID;

      if (svgFooter) {
        footer.innerHTML = s.footerSvg;
        normalizeSvg(footer);
      } else {
        const left   = s.footerLeft   || "";
        const center = s.footerCenter || "";
        let   right  = s.footerRight  || "";
        if (s.showDate) {
          const d = new Date().toLocaleDateString("bn-BD",
            { year: "numeric", month: "long", day: "numeric" });
          right = right ? `${right} | ${d}` : d;
        }
        footer.innerHTML = `<span>${left}</span><span>${center}</span><span>${right}</span>`;
      }
      document.body.appendChild(footer);
    }

    /* ── ৭. পেজ নম্বর এলিমেন্ট ── */
    if (s.pageNumbers) {
      const pageNum = document.createElement("div");
      pageNum.id = "__cphf_page_num__";
      pageNum.textContent = `পেজ নম্বর`;
      document.body.appendChild(pageNum);
    }

    /* ── ৮. ওয়াটারমার্ক এলিমেন্ট ── */
    const wmText = s.watermark === "custom" ? s.watermarkText : s.watermark;
    if (s.watermark !== "none" && wmText) {
      const watermark = document.createElement("div");
      watermark.id = "__cphf_watermark__";
      watermark.textContent = wmText;
      document.body.appendChild(watermark);
    }
  }

  /* ── লোড ও ইনজেক্ট ── */
  function loadAndInject() {
    chrome.storage.local.get("printSettings", result => {
      const s = Object.assign({}, DEFAULTS, result.printSettings || {});
      // RTL ডাইরেকশন ঠিক করা (স্ক্রিনে দেখার জন্য)
      fixRtlDirection(s.fixRtl);
      injectElements(s);
    });
  }

  /* ── ৫. JS কন্টেন্ট রিফ্রেশ ── */
  function handlePrintBeforePrint(s) {
    if (!s.forceReload) return;
    
    // ASP.NET pages need content refresh before print
    const hasPostBack = document.querySelector('form') && 
                        (document.querySelector('input[name*="__EVENTTARGET"]') || 
                         document.querySelector('input[name*="__VIEWSTATE"]'));
    
    if (hasPostBack) {
      // Re-trigger any visible content updates
      window.scrollTo(0, 0);
      // Small delay to let any lazy-loaded content render
      setTimeout(() => {
        // Trigger any visible update handlers
        document.querySelectorAll('[onclick*="doPostBack"], .aspNetHidden input').forEach(el => {
          // Just update the viewport, don't actually post
        });
      }, 100);
    }
  }

  // Listen for beforeprint event
  window.addEventListener('beforeprint', () => {
    chrome.storage.local.get("printSettings", result => {
      const s = Object.assign({}, DEFAULTS, result.printSettings || {});
      handlePrintBeforePrint(s);
      
      // প্রিন্টের আগে RTL ঠিক করা (যদি enable থাকে)
      fixRtlDirection(s.fixRtl);
      
      // Re-inject to ensure CSS is applied
      injectElements(s);
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.printSettings) {
      const s = Object.assign({}, DEFAULTS, changes.printSettings.newValue || {});
      // RTL ডাইরেকশন ঠিক করা
      fixRtlDirection(s.fixRtl);
      injectElements(s);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAndInject);
  } else {
    loadAndInject();
  }
})();
