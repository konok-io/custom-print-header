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
    footerLeft:     "",
    footerCenter:   "",
    footerRight:    "",
    showDate:       false,
    bgColor:        "#ffffff",
    textColor:      "#000000",
    borderColor:    "#2563eb",
    fontSize:       "12",
    fontFamily:     "StarNews",   /* বাংলা ফন্ট ডিফল্ট */
    contentOnly:    false,
    pageOrientation: "portrait",
    fixRtl:        false,
    removeFixed:   false,
    printBackground: false,
    forceReload:   false,
  };

  /* ── এলিমেন্ট সরানো ── */
  function removeElements() {
    [HEADER_ID, FOOTER_ID, STYLE_ID, FONT_ID].forEach(id => {
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

    const style = document.createElement("style");
    style.id    = STYLE_ID;
    style.textContent = `
      #${HEADER_ID}, #${FOOTER_ID} { display: none !important; }

      @media print {
        @page {
          size: A4 ${s.pageOrientation || "portrait"};
          margin-top:    ${hMargin};
          margin-bottom: ${fMargin};
          margin-left:   15mm;
          margin-right:  15mm;
        }

        /* ──── ১. নেভিগেশন/সাইডবার লুকান ──── */
        ${s.contentOnly ? `
          nav, .navbar, .nav, .navigation, .header-nav, .top-nav,
          header nav, .main-nav, .site-nav, [role="navigation"],
          .menu, .sidebar-menu, .nav-menu, .topbar, .navbar-header,
          aside, .sidebar, .side-bar, .left-sidebar, .right-sidebar,
          .sidebar-left, .sidebar-right, .aside, [role="complementary"],
          .menu-sidebar, .nav-sidebar, .widget-area, .secondary,
          .page-header, .site-header, .header, .top-header,
          #header, .header-area, .page-title-bar, .title-bar,
          footer, .footer, .site-footer, #footer, .page-footer,
          .footer-area, .copyright, .site-info, .footer-content,
          .advertisement, .ad, .ads, .promo, .promotion,
          .banner, .sponsor, [class*="ad-"], [class*="ads-"],
          .advert, .promotional, .promo-banner,
          .social, .share, .sharing, .social-share,
          .social-links, .share-buttons, [class*="share-"],
          .breadcrumb, .breadcrumbs, .pagination, .pager,
          .toolbar, .action-bar, .controls, .filters,
          .search-box, .search-form, .search-bar,
          main, .main, .content, .main-content, #content,
          .page-content, .article-content, .post-content,
          body > *:not(main):not(.${HEADER_ID.substring(2)}):not(.${FOOTER_ID.substring(2)}) {
            display: none !important;
          }
        ` : ""}

        /* ──── ২. Fixed এলিমেন্ট সরান ──── */
        ${s.removeFixed ? `
          * {
            position: relative !important;
          }
          [style*="position: fixed"], [style*="position:fixed"],
          [class*="fixed"], [id*="fixed"] {
            position: absolute !important;
          }
          /* সাধারণ fixed এলিমেন্ট */
          header, nav, .navbar, .header, .topbar, .toolbar {
            position: relative !important;
          }
        ` : ""}

        /* ──── ৩. RTL ঠিক করুন ──── */
        ${s.fixRtl ? `
          body, html { direction: ltr !important; }
          * { text-align: left !important; unicode-bidi: plaintext !important; }
          table { direction: ltr !important; }
          td, th { direction: ltr !important; text-align: left !important; }
        ` : ""}

        /* ──── ৪. ব্যাকগ্রাউন্ড প্রিন্ট ──── */
        ${s.printBackground ? `
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        ` : ""}

        /* ──── হেডার ──── */
        #${HEADER_ID} {
          display: ${hShow ? "block" : "none"} !important;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 2147483647;
          background: ${s.bgColor || "#fff"};
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
          #${HEADER_ID} .cphf-logo  { height: 58px; width: auto; object-fit: contain; flex-shrink: 0; }
          #${HEADER_ID} .cphf-div   { width: 2px; height: 54px; background: ${s.borderColor || "#2563eb"}; opacity: .4; flex-shrink: 0; }
          #${HEADER_ID} .cphf-info  { flex: 1; font-family: ${usedFont}; }
          #${HEADER_ID} .cphf-name  { font-family: ${usedFont}; font-size: ${fs + 4}px; font-weight: 700; margin: 0 0 2px; }
          #${HEADER_ID} .cphf-tag   { font-family: ${usedFont}; font-size: ${fs}px; margin: 0 0 3px; opacity: .78; }
          #${HEADER_ID} .cphf-det   { font-family: ${usedFont}; font-size: ${fs - 1}px; margin: 0; opacity: .7; }
        ` : `#${HEADER_ID} svg { width: 100%; height: auto; display: block; }`}

        /* ──── ফুটার ──── */
        #${FOOTER_ID} {
          display: ${fShow ? "block" : "none"} !important;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 2147483647;
          background: ${s.bgColor || "#fff"};
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
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
