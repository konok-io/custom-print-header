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

    /* ── ২.১. স্ক্রিনে RTL ঠিক করা (প্রিন্টের আগে দেখার জন্য) ── */
    let rtlScreenCSS = "";
    if (s.fixRtl) {
      rtlScreenCSS = `
        html[dir="rtl"], body[dir="rtl"] { direction: ltr !important; text-align: left !important; }
        [dir="rtl"], .rtl, [class*="rtl"] { direction: ltr !important; text-align: left !important; }
        table, thead, tbody, tr, th, td { direction: ltr !important; text-align: left !important; }
        * { direction: ltr !important; unicode-bidi: plaintext !important; }
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
          margin-top:    ${hMargin};
          margin-bottom: ${fMargin};
          margin-left:   15mm;
          margin-right:  15mm;
        }

        /* Chrome সামঞ্জস্যতা - body margin রিসেট */
        body {
          margin: 0 !important;
          padding: 0 !important;
          margin-left: 0 !important;
          min-width: 100% !important;
          max-width: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Chrome-এ ইনপুট ও টেবিল সঠিক সাইজ */
        input, select, textarea, table, td, th {
          max-width: none !important;
          width: auto !important;
          min-width: 0 !important;
        }

        /* ──── ১. নেভিগেশন/সাইডবার/লে-আউট লুকান (শুধু কন্টেন্ট দেখাবে) ──── */
        ${s.contentOnly ? `
          /* Navigation & Header */
          nav, .navbar, .nav, .navigation, .header-nav, .top-nav, .main-nav, .site-nav,
          header nav, .menu, .sidebar-menu, .nav-menu, .topbar, .navbar-header,
          .navbar-collapse, .nav-collapse, .navbar-toggle, .hamburger,
          
          /* Sidebar & Aside */
          aside, .sidebar, .side-bar, .left-sidebar, .right-sidebar,
          .sidebar-left, .sidebar-right, .aside, .widget-area, .secondary,
          [role="complementary"], .widget, .widgets,
          
          /* Header ও Footer sections */
          header, .header, .site-header, .page-header, .top-header, .main-header,
          #header, .header-area, .header-wrap, .header-wrapper,
          .page-title-bar, .title-bar, .page-title,
          footer, .footer, .site-footer, .page-footer, #footer,
          .footer-area, .footer-wrap, .copyright, .site-info, .footer-content,
          
          /* Ads & Promotions */
          .advertisement, .ad, .ads, .promo, .promotion, .advert, .promotional,
          .promo-banner, .banner, .sponsor, .adsbygoogle, .ads-container,
          [class*="ad-"], [class*="ads-"], [id*="ad-"], [id*="ads-"],
          
          /* Social & Share */
          .social, .share, .sharing, .social-share, .social-links, .share-buttons,
          [class*="share-"], [class*="social-"],
          
          /* Breadcrumb & Tools */
          .breadcrumb, .breadcrumbs, .pagination, .pager,
          .toolbar, .action-bar, .controls, .filters,
          .search-box, .search-form, .search-bar, .search,
          
          /* Layout Containers (যা কন্টেন্ট নয়) */
          .container-fluid, .container-wide, .wrapper, .wrap,
          .layout-sidebar, .layout-main, .main-wrapper, .content-wrapper,
          .page-wrapper, .site-wrapper, .site-container,
          .container, .row, .col, .grid,
          
          /* অন্যান্য নন-কন্টেন্ট এলিমেন্ট */
          [role="banner"], [role="navigation"], [role="contentinfo"],
          .hidden-print, .no-print, .print-hide,
          .modal, .popup, .overlay, .tooltip,
          video, audio, iframe, object, embed,
          
          /* Body direct children (শুধু হেডার/ফুটার এলিমেন্ট) */
          body > *:not(main):not(.${HEADER_ID.substring(2)}):not(.${FOOTER_ID.substring(2)}):not(#__cphf_page_num__):not(#__cphf_watermark__):not(article):not(section) {
            display: none !important;
          }
          
          /* কন্টেন্ট এলিমেন্ট show করা */
          main, [role="main"], [role="content"], article, section,
          .content, .main-content, .page-content, .post-content,
          .article-content, #content, .main, .page-content-area {
            display: block !important;
            visibility: visible !important;
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

        /* ──── ৩. RTL ওয়েবসাইট English/LTR স্টাইলে ──── */
        ${s.fixRtl ? `
          /* Chrome সামঞ্জস্যতা */
          * { box-sizing: border-box !important; }
          
          /* RTL ওয়েবসাইট ঠিক করা */
          html[dir="rtl"], body[dir="rtl"], [dir="rtl"] {
            direction: ltr !important;
            text-align: left !important;
          }
          
          /* সব এলিমেন্ট LTR */
          [dir="rtl"], .rtl, [class*="rtl"], [style*="rtl"] {
            direction: ltr !important;
            text-align: left !important;
          }
          
          /* টেবিল ও ফর্ম এলিমেন্ট */
          table, thead, tbody, tr, th, td, input, select, textarea {
            direction: ltr !important;
            text-align: left !important;
          }
          
          /* মার্জিন রিসেট - Chrome-এ সমস্যা সমাধান */
          [dir="rtl"], body[dir="rtl"] {
            margin-right: 0 !important;
            padding-right: 0 !important;
          }
          
          /* সব এলিমেন্ট LTR */
          * {
            direction: ltr !important;
            unicode-bidi: plaintext !important;
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

        /* ──── হেডার (পূর্ণ প্রস্থ) ──── */
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          overflow: visible !important;
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
          #${HEADER_ID} .cphf-info  { flex: 1; min-width: 0; font-family: ${usedFont}; }
          #${HEADER_ID} .cphf-name  { font-family: ${usedFont}; font-size: ${fs + 4}px; font-weight: 700; margin: 0 0 2px; }
          #${HEADER_ID} .cphf-tag   { font-family: ${usedFont}; font-size: ${fs}px; margin: 0 0 3px; opacity: .78; }
          #${HEADER_ID} .cphf-det   { font-family: ${usedFont}; font-size: ${fs - 1}px; margin: 0; opacity: .7; }
        ` : `#${HEADER_ID} svg { width: 100%; height: auto; display: block; }`}

        /* ──── ফুটার (পূর্ণ প্রস্থ) ──── */
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
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          overflow: visible !important;
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

        ${!svgFooter ? `#${FOOTER_ID} span { max-width: 33%; word-break: break-word; font-family: ${usedFont}; }` : `#${FOOTER_ID} svg { width: 100%; height: auto; display: block; }`}
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
      injectElements(Object.assign({}, DEFAULTS, result.printSettings || {}));
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
      
      // Re-inject to ensure CSS is applied
      injectElements(s);
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.printSettings) {
      injectElements(Object.assign({}, DEFAULTS, changes.printSettings.newValue || {}));
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAndInject);
  } else {
    loadAndInject();
  }
})();
