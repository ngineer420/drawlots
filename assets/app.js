/*
 * drawlots.net — site chrome: theme toggle, mobile nav, and the homepage's
 * progressive-enhancement tab switching (real <a href> links become instant
 * panel swaps + history.pushState, but work as plain navigations without JS
 * or with a middle-click / ctrl-click).
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

  function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("tool-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ------------------------------------------------------- panel switching --

  function initPanelNav() {
    var panels = document.querySelectorAll("[data-panel]");
    if (!panels.length) return; // standalone tool pages have no panel router

    var overview = document.getElementById("overview-panel");
    var navLinks = document.querySelectorAll("[data-panel-link]");
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
    initMobileNav();
    initPanelNav();
    initHeroLots();
  });
})();
