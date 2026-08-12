/*
 * drawlots.net — site chrome: theme toggle, the portfolio toolbar, and the
 * homepage's progressive-enhancement panel switching (real <a href> links
 * become instant panel swaps + history.pushState, but work as plain
 * navigations without JS or with a middle-click / ctrl-click).
 */
(function () {
  "use strict";

  var THEME_KEY = "drawlots-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function currentTheme() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function initThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  /* ==================================================================== *
   * toolbar v1 — the portfolio navigation pattern.                       *
   * Spec: github.com/ngineer420/ngineer420.github.io/issues/13          *
   *                                                                     *
   * Copy this block verbatim into any site in the portfolio. It is pure *
   * enhancement: with JS off, <details>/<summary> still discloses the   *
   * sheet, the rail is still a native scroll container of real links,   *
   * the edge fades are still CSS and the scrim is still CSS. Only the   *
   * active-chip centring, Escape and click-outside are lost.            *
   * ================================================================== */
  function initToolbar() {
    var bar = document.querySelector(".toolbar");
    if (!bar) return;
    var rail = bar.querySelector(".tb-rail");
    var menu = bar.querySelector("details.tb-menu");

    if (rail) {
      // js-on hands the right-hand fade over to measurement. Until then the
      // CSS keeps it on, so a JS-disabled visitor never gets a chip clipped
      // mid-word with nothing to say there is more of the row.
      rail.classList.add("js-on");
      var fades = function () {
        var max = rail.scrollWidth - rail.clientWidth;
        rail.classList.toggle("can-l", rail.scrollLeft > 1);
        rail.classList.toggle("can-r", rail.scrollLeft < max - 1);
      };
      // Assigning scrollLeft, never scrollIntoView: that also scrolls every
      // ancestor and the document, which on a phone drops the visitor below
      // the header on arrival.
      var current = rail.querySelector("[aria-current]");
      if (current) {
        rail.scrollLeft = Math.max(
          0,
          current.offsetLeft - (rail.clientWidth - current.offsetWidth) / 2
        );
      }
      rail.addEventListener("scroll", fades, { passive: true });
      window.addEventListener("resize", fades);
      fades();
    }

    if (menu) {
      // A disclosure, not a modal: focus is deliberately not trapped, Tab
      // walks the links and straight out the other side.
      window.addEventListener("keydown", function (e) {
        if (e.key !== "Escape" || !menu.open) return;
        menu.open = false;
        var summary = menu.querySelector("summary");
        if (summary) summary.focus();
      });
      document.addEventListener("click", function (e) {
        if (menu.open && !menu.contains(e.target)) menu.open = false;
      });
      // Site-local: on the homepage a sheet link switches a panel in place
      // rather than navigating, so nothing else would ever close the sheet
      // over the tool the visitor just picked.
      menu.addEventListener("click", function (e) {
        var a = e.target.closest ? e.target.closest(".tb-sheet a") : null;
        if (a) menu.open = false;
      });
    }
  }

  // ------------------------------------------------------- panel switching --

  function initPanelNav() {
    var panels = document.querySelectorAll("[data-panel]");
    if (!panels.length) return; // standalone tool pages have no panel router

    var overview = document.getElementById("overview-panel");
    var navLinks = document.querySelectorAll("[data-panel-link]");
    var hero = document.querySelector(".hero");
    var siteTitle = document.title.indexOf("|") !== -1 ? document.title.split("|").pop().trim() : document.title;

    function panelFor(slug) {
      if (!slug) return null;
      return document.querySelector('[data-panel="' + slug + '"]');
    }

    function showPanel(slug, opts) {
      opts = opts || {};
      slug = slug || "spinner-wheel"; // homepage shows the primary tool live
      panels.forEach(function (p) { p.hidden = true; });
      if (overview) overview.hidden = !!slug;
      // Hide the tall marketing hero when a specific tool is shown so the tool
      // sits right under the nav instead of below a banner.
      if (hero) hero.hidden = !!slug;

      var target = panelFor(slug);
      if (target) {
        target.hidden = false;
        document.body.setAttribute("data-tool", slug);
        if (target.dataset.title) document.title = target.dataset.title;
        if (!opts.skipFocus) {
          var heading = target.querySelector("h1, h2");
          if (heading) heading.focus();
        }
      } else {
        document.body.removeAttribute("data-tool");
        document.title = document.title; // homepage title already correct
      }

      navLinks.forEach(function (a) {
        var linkSlug = a.getAttribute("data-panel-link");
        if (linkSlug === (slug || "")) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    }

    document.addEventListener("click", function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest ? e.target.closest("[data-panel-link]") : null;
      if (!link) return;
      // Only intercept same-page panel links (this page must own that panel).
      var slug = link.getAttribute("data-panel-link");
      if (slug && !panelFor(slug)) return; // no such panel here — let it navigate normally
      e.preventDefault();
      var path = slug ? "/" + slug + "/" : "/";
      if (window.location.pathname !== path) {
        history.pushState({ slug: slug }, "", path);
      }
      showPanel(slug);
    });

    window.addEventListener("popstate", function (e) {
      var slug = e.state ? e.state.slug : (window.location.pathname === "/" ? null : window.location.pathname.replace(/\//g, ""));
      showPanel(slug || null, { skipFocus: true });
    });

    // Sync initial state from the URL (handles a direct load of /dice-roller/
    // when index.html itself is what's cached, which shouldn't normally
    // happen on GitHub Pages but costs nothing to guard).
    var initialSlug = window.location.pathname.replace(/\//g, "");
    showPanel(panelFor(initialSlug) ? initialSlug : null, { skipFocus: true });
  }

  // ---------------------------------------------------------- hero flourish --

  function initHeroLots() {
    var stick = document.querySelector(".lot-stick.drawn");
    if (!stick) return;
    // Re-trigger the CSS animation on load in case the page was restored
    // from bfcache mid-animation.
    stick.style.animation = "none";
    void stick.offsetHeight;
    stick.style.animation = "";
  }

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initToolbar();
    initPanelNav();
    initHeroLots();
  });
})();
