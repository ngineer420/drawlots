/*
 * drawlots.net — per-tool interactive logic.
 * Every init*() guards on its own root element so this single file can be
 * safely included on every page (homepage has all six workspaces hidden in
 * panels; a standalone tool page only has its own markup).
 */
(function () {
  "use strict";

  var R = window.DrawlotsRandom;
  var qsp = new URLSearchParams(window.location.search);

  function $(id) {
    return document.getElementById(id);
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function parseList(text) {
    return text
      .split("\n")
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  function setShareUrl(input, path, params) {
    if (!input) return;
    var url = new URL(path, window.location.origin);
    Object.keys(params).forEach(function (k) {
      if (params[k] !== "" && params[k] != null) url.searchParams.set(k, params[k]);
    });
    input.value = url.toString();
  }

  function wireCopyButton(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener("click", function () {
      var text = input.value;
      var done = function () {
        var original = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = original; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(input, done); });
      } else {
        fallbackCopy(input, done);
      }
    });
  }

  function fallbackCopy(input, done) {
    input.removeAttribute("readonly");
    input.focus();
    input.select();
    try { document.execCommand("copy"); } catch (e) {}
    input.setAttribute("readonly", "readonly");
    done();
  }

  // Rapidly cycles el's text through random candidates, decelerating into
  // finalText. Skips straight to finalText under reduced-motion.
  function flickerText(el, candidateFn, finalText, opts) {
    opts = opts || {};
    if (reducedMotion()) {
      el.textContent = finalText;
      if (opts.onDone) opts.onDone();
      return;
    }
    var ticks = opts.ticks || 16;
    var delay = opts.startDelay || 55;
    var i = 0;
    (function tick() {
      if (i >= ticks) {
        el.textContent = finalText;
        if (opts.onDone) opts.onDone();
        return;
      }
      el.textContent = candidateFn();
      i++;
      delay *= 1.12;
      setTimeout(tick, delay);
    })();
  }

  // ---------------------------------------------------------------- wheel --

  var WHEEL_COLORS = ["#ff5d5d", "#ffb238", "#4cc9f0", "#b185f0", "#3ddc97", "#f2d24b", "#ff8fab", "#7ee787"];

  function initWheel() {
    var canvas = $("sw-canvas");
    var entriesEl = $("sw-entries");
    if (!canvas || !entriesEl) return;

    var spinBtn = $("sw-spin-btn");
    var removeWinnerEl = $("sw-remove-winner");
    var resultEl = $("sw-result");
    var winnerText = $("sw-winner-text");
    var messageEl = $("sw-message");
    var shareInput = $("sw-share-url");
    var shareBtn = $("sw-copy-link");

    var sizeParam = qsp.get("entries");
    if (sizeParam) {
      entriesEl.value = sizeParam.split(",").map(function (s) { return decodeURIComponent(s.trim()); }).join("\n");
    }

    var SIZE = 340;
    canvas.width = SIZE;
    canvas.height = SIZE;
    var ctx = canvas.getContext("2d");
    var rotation = 0;
    var spinning = false;

    function getEntries() {
      return parseList(entriesEl.value);
    }

    function draw() {
      var entries = getEntries();
      ctx.clearRect(0, 0, SIZE, SIZE);
      if (entries.length === 0) return;
      var cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 6;
      var n = entries.length;
      var seg = (Math.PI * 2) / Math.max(n, 1);
      for (var i = 0; i < n; i++) {
        var start = i * seg - Math.PI / 2;
        var end = start + seg;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
        ctx.fill();
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + seg / 2);
        ctx.font = "600 15px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        var label = entries[i].length > 16 ? entries[i].slice(0, 15) + "…" : entries[i];
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.strokeText(label, r - 16, 0);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, r - 16, 0);
        ctx.restore();
      }
    }

    function updateShare() {
      setShareUrl(shareInput, "/spinner-wheel", { entries: getEntries().map(encodeURIComponent).join(",") });
    }

    entriesEl.addEventListener("input", function () {
      draw();
      updateShare();
    });

    spinBtn.addEventListener("click", function () {
      if (spinning) return;
      var entries = getEntries();
      if (entries.length < 2) {
        messageEl.textContent = "Add at least two entries, one per line, to spin the wheel.";
        return;
      }
      messageEl.textContent = "";
      spinning = true;
      spinBtn.setAttribute("disabled", "disabled");
      resultEl.classList.remove("is-live");
      resultEl.hidden = true;

      var n = entries.length;
      var segDeg = 360 / n;
      var targetIndex = R.int(0, n - 1);
      var centerDeg = targetIndex * segDeg + segDeg / 2;
      var neededMod = (360 - centerDeg) % 360;
      var currentMod = ((rotation % 360) + 360) % 360;
      var forward = ((neededMod - currentMod) % 360 + 360) % 360;
      if (forward < 1) forward += 360;
      var extraSpins = R.int(6, 9);
      var totalDelta = forward + extraSpins * 360;
      rotation += totalDelta;

      var reveal = function () {
        spinning = false;
        spinBtn.removeAttribute("disabled");
        winnerText.textContent = entries[targetIndex];
        resultEl.hidden = false;
        resultEl.classList.add("is-live");
        if (removeWinnerEl && removeWinnerEl.checked) {
          var remaining = entries.slice();
          remaining.splice(targetIndex, 1);
          entriesEl.value = remaining.join("\n");
          canvas.style.transition = "none";
          rotation = 0;
          canvas.style.transform = "rotate(0deg)";
          draw();
          updateShare();
          // force reflow so the next spin's transition re-applies
          void canvas.offsetHeight;
          canvas.style.transition = "";
        }
      };

      if (reducedMotion()) {
        canvas.style.transition = "none";
        canvas.style.transform = "rotate(" + (rotation % 360) + "deg)";
        reveal();
      } else {
        canvas.style.transition = "transform 4200ms cubic-bezier(0.14, 0.85, 0.18, 1)";
        canvas.style.transform = "rotate(" + rotation + "deg)";
        var handled = false;
        var onEnd = function () {
          if (handled) return;
          handled = true;
          canvas.removeEventListener("transitionend", onEnd);
          reveal();
        };
        canvas.addEventListener("transitionend", onEnd);
        setTimeout(onEnd, 4400);
      }
    });

    wireCopyButton(shareBtn, shareInput);
    draw();
    updateShare();
  }

  // ---------------------------------------------------------- name picker --

  function initNamePicker() {
    var namesEl = $("np-names");
    if (!namesEl) return;

    var pickBtn = $("np-pick-btn");
    var removeWinnerEl = $("np-remove-winner");
    var resultEl = $("np-result");
    var winnerText = $("np-winner-text");
    var messageEl = $("np-message");
    var shareInput = $("np-share-url");
    var shareBtn = $("np-copy-link");

    var namesParam = qsp.get("names");
    if (namesParam) {
      namesEl.value = namesParam.split(",").map(function (s) { return decodeURIComponent(s.trim()); }).join("\n");
    }

    function updateShare() {
      setShareUrl(shareInput, "/random-name-picker", { names: parseList(namesEl.value).map(encodeURIComponent).join(",") });
    }
    namesEl.addEventListener("input", updateShare);

    pickBtn.addEventListener("click", function () {
      var names = parseList(namesEl.value);
      if (names.length < 2) {
        messageEl.textContent = "Add at least two names, one per line, to pick from.";
        return;
      }
      messageEl.textContent = "";
      pickBtn.setAttribute("disabled", "disabled");
      var winnerIndex = R.int(0, names.length - 1);
      var winner = names[winnerIndex];
      resultEl.hidden = false;
      resultEl.classList.remove("is-live");
      flickerText(winnerText, function () { return R.pick(names); }, winner, {
        ticks: 20,
        onDone: function () {
          resultEl.classList.add("is-live");
          pickBtn.removeAttribute("disabled");
          if (removeWinnerEl && removeWinnerEl.checked) {
            var remaining = names.slice();
            remaining.splice(winnerIndex, 1);
            namesEl.value = remaining.join("\n");
            updateShare();
          }
        },
      });
    });

    wireCopyButton(shareBtn, shareInput);
    updateShare();
  }

  // -------------------------------------------------------------- dice --

  var PIP_LAYOUTS = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  };

  function buildDieFace(value, sides) {
    var die = document.createElement("div");
    die.className = "die";
    if (sides === 6) {
      var grid = document.createElement("div");
      grid.className = "pip-grid";
      for (var i = 1; i <= 9; i++) {
        var pip = document.createElement("span");
        pip.className = "pip" + (PIP_LAYOUTS[value].indexOf(i) !== -1 ? " on" : "");
        grid.appendChild(pip);
      }
      die.appendChild(grid);
    } else {
      var num = document.createElement("span");
      num.className = "num";
      num.textContent = String(value);
      die.appendChild(num);
      var tag = document.createElement("span");
      tag.className = "sides-tag";
      tag.textContent = "d" + sides;
      die.appendChild(tag);
    }
    return die;
  }

  function initDice() {
    var tray = $("dr-tray");
    if (!tray) return;

    var countEl = $("dr-count");
    var sidesEl = $("dr-sides");
    var rollBtn = $("dr-roll-btn");
    var totalEl = $("dr-total");
    var totalWrap = $("dr-total-wrap");
    var shareInput = $("dr-share-url");
    var shareBtn = $("dr-copy-link");

    var diceParam = parseInt(qsp.get("dice"), 10);
    var sidesParam = parseInt(qsp.get("sides"), 10);
    if (diceParam >= 1 && diceParam <= 6) countEl.value = String(diceParam);
    if ([4, 6, 8, 10, 12, 20].indexOf(sidesParam) !== -1) sidesEl.value = String(sidesParam);

    function updateShare() {
      setShareUrl(shareInput, "/dice-roller", { dice: countEl.value, sides: sidesEl.value });
    }
    countEl.addEventListener("change", updateShare);
    sidesEl.addEventListener("change", updateShare);

    function renderInitial() {
      tray.innerHTML = "";
      var count = parseInt(countEl.value, 10) || 2;
      var sides = parseInt(sidesEl.value, 10) || 6;
      for (var i = 0; i < count; i++) tray.appendChild(buildDieFace(1, sides));
      totalWrap.hidden = true;
    }

    rollBtn.addEventListener("click", function () {
      var count = parseInt(countEl.value, 10) || 2;
      var sides = parseInt(sidesEl.value, 10) || 6;
      var values = [];
      for (var i = 0; i < count; i++) values.push(R.int(1, sides));
      var total = values.reduce(function (a, b) { return a + b; }, 0);

      tray.innerHTML = "";
      values.forEach(function (v) {
        var die = buildDieFace(v, sides);
        tray.appendChild(die);
        if (!reducedMotion()) {
          void die.offsetHeight;
          die.classList.add("is-rolling");
        }
      });

      totalEl.textContent = String(total);
      totalWrap.hidden = false;
      updateShare();
    });

    wireCopyButton(shareBtn, shareInput);
    renderInitial();
    updateShare();
  }

  // -------------------------------------------------------------- coin --

  function initCoin() {
    var coin = $("cf-coin");
    if (!coin) return;

    var flipBtn = $("cf-flip-btn");
    var countEl = $("cf-count");
    var headsCountEl = $("cf-heads-count");
    var tailsCountEl = $("cf-tails-count");
    var resetBtn = $("cf-reset");
    var resultEl = $("cf-result");
    var resultText = $("cf-result-text");

    var rotation = 0;
    var flipping = false;
    var heads = 0, tails = 0;

    flipBtn.addEventListener("click", function () {
      if (flipping) return;
      var count = parseInt(countEl.value, 10) || 1;
      var results = [];
      for (var i = 0; i < count; i++) results.push(R.int(0, 1) === 0 ? "heads" : "tails");
      var displayResult = results[results.length - 1];
      var neededMod = displayResult === "heads" ? 0 : 180;
      var currentMod = ((rotation % 360) + 360) % 360;
      var forward = ((neededMod - currentMod) % 360 + 360) % 360;
      if (forward < 1) forward += 360;
      var extra = R.int(4, 7) * 360;
      rotation += forward + extra;

      flipping = true;
      flipBtn.setAttribute("disabled", "disabled");
      resultEl.hidden = true;

      var reveal = function () {
        flipping = false;
        flipBtn.removeAttribute("disabled");
        results.forEach(function (r) { if (r === "heads") heads++; else tails++; });
        headsCountEl.textContent = String(heads);
        tailsCountEl.textContent = String(tails);
        if (count === 1) {
          resultText.textContent = displayResult === "heads" ? "Heads" : "Tails";
        } else {
          var h = results.filter(function (r) { return r === "heads"; }).length;
          var t = count - h;
          resultText.textContent = h + " heads, " + t + " tails";
        }
        resultEl.hidden = false;
        resultEl.classList.add("is-live");
      };

      if (reducedMotion()) {
        coin.classList.remove("is-flipping");
        coin.style.transform = "rotateY(" + (rotation % 360) + "deg)";
        reveal();
      } else {
        coin.classList.add("is-flipping");
        coin.style.transform = "rotateY(" + rotation + "deg)";
        var handled = false;
        var onEnd = function () {
          if (handled) return;
          handled = true;
          coin.removeEventListener("transitionend", onEnd);
          reveal();
        };
        coin.addEventListener("transitionend", onEnd);
        setTimeout(onEnd, 1300);
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        heads = 0; tails = 0;
        headsCountEl.textContent = "0";
        tailsCountEl.textContent = "0";
        resultEl.hidden = true;
      });
    }
  }

  // ---------------------------------------------------------------- rng --

  function initRng() {
    var generateBtn = $("rng-generate-btn");
    if (!generateBtn) return;

    var minEl = $("rng-min");
    var maxEl = $("rng-max");
    var countEl = $("rng-count");
    var uniqueEl = $("rng-unique");
    var decimalEl = $("rng-decimal");
    var placesField = $("rng-places-field");
    var placesEl = $("rng-places");
    var displayEl = $("rng-display");
    var messageEl = $("rng-message");
    var shareInput = $("rng-share-url");
    var shareBtn = $("rng-copy-link");

    var minParam = qsp.get("min"), maxParam = qsp.get("max"), countParam = qsp.get("count");
    if (minParam !== null && minParam !== "") minEl.value = minParam;
    if (maxParam !== null && maxParam !== "") maxEl.value = maxParam;
    if (countParam !== null && countParam !== "") countEl.value = countParam;

    function toggleDecimalPlaces() {
      placesField.hidden = !decimalEl.checked;
    }
    decimalEl.addEventListener("change", toggleDecimalPlaces);
    toggleDecimalPlaces();

    function updateShare() {
      setShareUrl(shareInput, "/random-number-generator", {
        min: minEl.value, max: maxEl.value, count: countEl.value,
      });
    }
    [minEl, maxEl, countEl].forEach(function (el) { el.addEventListener("input", updateShare); });

    generateBtn.addEventListener("click", function () {
      var min = parseFloat(minEl.value);
      var max = parseFloat(maxEl.value);
      var count = Math.max(1, Math.min(20, parseInt(countEl.value, 10) || 1));
      messageEl.textContent = "";

      if (isNaN(min) || isNaN(max)) {
        messageEl.textContent = "Enter both a minimum and a maximum.";
        return;
      }
      if (min > max) { var t = min; min = max; max = t; }

      var results = [];
      if (decimalEl.checked) {
        var places = parseInt(placesEl.value, 10) || 1;
        var factor = Math.pow(10, places);
        for (var i = 0; i < count; i++) {
          results.push((R.floatRange(min, max + 1 / factor)).toFixed(places));
        }
      } else {
        var lo = Math.ceil(min), hi = Math.floor(max);
        if (uniqueEl.checked && count > hi - lo + 1) {
          messageEl.textContent = "Range only has " + (hi - lo + 1) + " whole numbers — can't pick " + count + " unique ones.";
          return;
        }
        if (uniqueEl.checked) {
          var pool = [];
          for (var n = lo; n <= hi; n++) pool.push(n);
          results = R.shuffle(pool).slice(0, count).map(String);
        } else {
          for (var j = 0; j < count; j++) results.push(String(R.int(lo, hi)));
        }
      }

      displayEl.innerHTML = "";
      results.forEach(function (val) {
        var group = document.createElement("span");
        group.className = "rng-digit-group";
        displayEl.appendChild(group);
        flickerText(group, function () { return String(R.int(Math.floor(min), Math.ceil(max))); }, val, { ticks: 14 });
      });
      updateShare();
    });

    wireCopyButton(shareBtn, shareInput);
    updateShare();
  }

  // -------------------------------------------------------------- teams --

  function initTeams() {
    var namesEl = $("tg-names");
    if (!namesEl) return;

    var teamsCountEl = $("tg-teams");
    var generateBtn = $("tg-generate-btn");
    var resultsEl = $("tg-results");
    var messageEl = $("tg-message");
    var shareInput = $("tg-share-url");
    var shareBtn = $("tg-copy-link");

    var namesParam = qsp.get("names");
    var teamsParam = qsp.get("teams");
    if (namesParam) {
      namesEl.value = namesParam.split(",").map(function (s) { return decodeURIComponent(s.trim()); }).join("\n");
    }
    if (teamsParam) teamsCountEl.value = teamsParam;

    function updateShare() {
      setShareUrl(shareInput, "/team-generator", {
        names: parseList(namesEl.value).map(encodeURIComponent).join(","),
        teams: teamsCountEl.value,
      });
    }
    namesEl.addEventListener("input", updateShare);
    teamsCountEl.addEventListener("input", updateShare);

    generateBtn.addEventListener("click", function () {
      var names = parseList(namesEl.value);
      var teamCount = Math.max(2, Math.min(10, parseInt(teamsCountEl.value, 10) || 2));
      messageEl.textContent = "";

      if (names.length < teamCount) {
        messageEl.textContent = "Add at least " + teamCount + " names to fill " + teamCount + " teams.";
        return;
      }

      var shuffled = R.shuffle(names);
      var teams = [];
      for (var i = 0; i < teamCount; i++) teams.push([]);
      shuffled.forEach(function (name, i) {
        teams[i % teamCount].push(name);
      });

      resultsEl.innerHTML = "";
      teams.forEach(function (members, i) {
        var card = document.createElement("div");
        card.className = "team-card";
        var h3 = document.createElement("h3");
        h3.textContent = "Team " + (i + 1);
        card.appendChild(h3);
        var ul = document.createElement("ul");
        members.forEach(function (m) {
          var li = document.createElement("li");
          li.textContent = m;
          ul.appendChild(li);
        });
        card.appendChild(ul);
        resultsEl.appendChild(card);
      });
      updateShare();
    });

    wireCopyButton(shareBtn, shareInput);
    updateShare();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initWheel();
    initNamePicker();
    initDice();
    initCoin();
    initRng();
    initTeams();
  });
})();
