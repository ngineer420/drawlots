/*
 * drawlots.net — per-tool interactive logic.
 * Every init*() guards on its own root element so this single file can be
 * safely included on every page (homepage has all nine workspaces hidden in
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

  // ------------------------------------------------------------ bracket --

  // Standard single-elimination seeding order. Seed 1 meets seed 2 only in the
  // final, seed 1 meets seed 3 or 4 only in the semi, and so on down — which is
  // the whole point of seeding. Built by repeatedly splitting: each seed s in a
  // bracket of size k becomes the pair (s, 2k+1-s) in a bracket of size 2k.
  //
  // For 8 that gives 1,8,4,5,2,7,3,6 — the order every printed draw sheet uses.
  function seedOrder(size) {
    var order = [1];
    while (order.length < size) {
      var total = order.length * 2 + 1;
      var next = [];
      for (var i = 0; i < order.length; i++) {
        next.push(order[i]);
        next.push(total - order[i]);
      }
      order = next;
    }
    return order;
  }

  // Byes are not scattered at random and they are not all bunched at the top of
  // the sheet: they belong to the highest seeds, one each. Filling the bracket
  // in seed order and letting the seeds that do not exist be byes does that on
  // its own — with 6 entrants in a bracket of 8, seeds 7 and 8 are missing, and
  // they sit opposite seeds 2 and 1, so exactly the top two get the walkover.
  function buildBracket(entrants) {
    var n = entrants.length;
    var size = 1;
    while (size < n) size *= 2;

    var order = seedOrder(size);
    var slots = [];
    for (var i = 0; i < size; i++) {
      var seed = order[i];
      slots.push(seed <= n ? { name: entrants[seed - 1], seed: seed } : null);
    }

    // Round 0 is the drawn entrants; each later round holds the winners, which
    // are known only where a bye decided them.
    var rounds = [slots];
    var prev = slots;
    var firstRound = true;
    while (prev.length > 1) {
      var next = [];
      for (var m = 0; m + 1 < prev.length; m += 2) {
        var a = prev[m], b = prev[m + 1];
        // A bye advances its player without playing — but only out of round
        // one, because that is the only round where an empty slot means
        // "nobody was drawn here". From round two on, an empty slot means "the
        // winner of a match nobody has played yet", and carrying a name
        // through one of those would be printing a result that has not
        // happened. Byes are a property of the draw, not a free pass up the
        // sheet.
        if (firstRound && a && !b) next.push(a);
        else if (firstRound && !a && b) next.push(b);
        else next.push(null);
      }
      rounds.push(next);
      prev = next;
      firstRound = false;
    }
    return { rounds: rounds, size: size, byes: size - n };
  }

  function roundName(index, totalRounds) {
    var fromEnd = totalRounds - index;
    if (fromEnd === 1) return "Final";
    if (fromEnd === 2) return "Semi-finals";
    if (fromEnd === 3) return "Quarter-finals";
    return "Round " + (index + 1);
  }

  var SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  // Names go in as textContent, never as markup — same rule as everywhere else
  // on the site. Long ones are cut rather than allowed to run into the next
  // round's column.
  function svgText(x, y, str, cls, maxChars) {
    var el = svgEl("text", { x: x, y: y, class: cls });
    el.textContent = str.length > maxChars ? str.slice(0, maxChars - 1) + "…" : str;
    return el;
  }

  function drawBracket(bracket) {
    var rounds = bracket.rounds;
    var totalRounds = rounds.length - 1;
    var LINE = 30, COL = 168, GAP = 34, TOP = 28, PAD = 6;
    var width = totalRounds * (COL + GAP) + COL + PAD * 2;
    var height = bracket.size * LINE + TOP + PAD;

    var svg = svgEl("svg", {
      class: "bracket-svg",
      viewBox: "0 0 " + width + " " + height,
      role: "img",
      "aria-label": "Single elimination bracket",
    });

    // Slot centres, defined from round 0 outwards: a match's winner sits
    // exactly halfway between the two players who could produce it, which is
    // what makes the connectors straight.
    var centres = [];
    var r, s;
    for (r = 0; r < rounds.length; r++) {
      centres.push([]);
      for (s = 0; s < rounds[r].length; s++) {
        centres[r].push(r === 0
          ? TOP + (s + 0.5) * LINE
          : (centres[r - 1][s * 2] + centres[r - 1][s * 2 + 1]) / 2);
      }
    }

    var colX = function (round) { return PAD + round * (COL + GAP); };

    for (r = 0; r < rounds.length; r++) {
      var x = colX(r);
      var label = r === rounds.length - 1 ? "Winner" : roundName(r, totalRounds);
      svg.appendChild(svgText(x, 16, label, "bracket-round-label", 24));

      for (s = 0; s < rounds[r].length; s++) {
        var y = centres[r][s];
        var entry = rounds[r][s];

        // The line you write the winner on, whether or not it is filled in.
        svg.appendChild(svgEl("line", {
          x1: x, y1: y + 5, x2: x + COL, y2: y + 5, class: "bracket-rule",
        }));

        if (entry && r === 0) {
          svg.appendChild(svgText(x + 2, y + 1, String(entry.seed), "bracket-seed", 3));
          svg.appendChild(svgText(x + 22, y + 1, entry.name, "bracket-name", 20));
        } else if (entry) {
          // The only name that can be printed in a later round before anyone
          // has played is one that got there on a bye, so it is drawn lighter:
          // it is a name the draw put there, not a result.
          svg.appendChild(svgText(x + 2, y + 1, entry.name, "bracket-name bracket-advanced", 22));
        } else if (r === 0) {
          svg.appendChild(svgText(x + 2, y + 1, "bye", "bracket-bye", 4));
        }

        // Connector into the next round: out of this slot, across to the
        // half-way point, and down or up to meet its partner.
        if (r < rounds.length - 1) {
          var mid = x + COL + GAP / 2;
          var partnerY = centres[r][s % 2 === 0 ? s + 1 : s - 1];
          svg.appendChild(svgEl("path", {
            class: "bracket-link",
            d: "M" + (x + COL) + " " + (y + 5) + "H" + mid + "V" + (partnerY + 5),
          }));
          if (s % 2 === 0) {
            svg.appendChild(svgEl("path", {
              class: "bracket-link",
              d: "M" + mid + " " + (centres[r + 1][s / 2] + 5) + "H" + colX(r + 1),
            }));
          }
        }
      }
    }
    return svg;
  }

  function initBracket() {
    var namesEl = $("br-names");
    if (!namesEl) return;

    var seedingEl = $("br-seeding");
    var generateBtn = $("br-generate-btn");
    var resultsEl = $("br-results");
    var summaryEl = $("br-summary");
    var messageEl = $("br-message");
    var shareInput = $("br-share-url");
    var shareBtn = $("br-copy-link");

    var namesParam = qsp.get("names");
    var seedingParam = qsp.get("seeding");
    if (namesParam) {
      namesEl.value = namesParam.split(",").map(function (s) { return decodeURIComponent(s.trim()); }).join("\n");
    }
    if (seedingParam === "random" || seedingParam === "listed") seedingEl.value = seedingParam;

    function updateShare() {
      setShareUrl(shareInput, "/tournament-bracket", {
        names: parseList(namesEl.value).map(encodeURIComponent).join(","),
        seeding: seedingEl.value,
      });
    }
    namesEl.addEventListener("input", updateShare);
    seedingEl.addEventListener("change", updateShare);

    generateBtn.addEventListener("click", function () {
      var names = parseList(namesEl.value);
      messageEl.textContent = "";
      summaryEl.textContent = "";
      resultsEl.innerHTML = "";

      if (names.length < 2) {
        messageEl.textContent = "Add at least 2 entrants to draw a bracket.";
        return;
      }
      if (names.length > 128) {
        messageEl.textContent = "That is " + names.length + " entrants; 128 is the most that fits on a readable sheet.";
        return;
      }

      var entrants = seedingEl.value === "listed" ? names.slice() : R.shuffle(names);
      var bracket = buildBracket(entrants);
      resultsEl.appendChild(drawBracket(bracket));

      var rounds = bracket.rounds.length - 1;
      summaryEl.textContent = names.length + " entrants in a bracket of " + bracket.size + " — " +
        rounds + (rounds === 1 ? " round" : " rounds") + ", " +
        (bracket.byes === 0
          ? "no byes, the draw is a clean power of two."
          : bracket.byes + (bracket.byes === 1 ? " bye, given to the top seed." : " byes, one each to the top " + bracket.byes + " seeds."));
      updateShare();
    });

    wireCopyButton(shareBtn, shareInput);
    updateShare();
  }

  // ------------------------------------------------------------- santa --

  // A link has to survive being pasted into a chat window, so the name inside
  // it is base64 in the URL-safe alphabet. This hides it from a glance, which
  // is all it can honestly claim: anyone holding the link can decode it, and
  // the FAQ says so rather than pretending otherwise.
  function encodeName(str) {
    var utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (m, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    });
    return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decodeName(str) {
    var b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    var raw = atob(b64);
    return decodeURIComponent(raw.split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
  }

  // Who may draw whom. Nobody draws themselves, and an exclusion cuts both
  // ways: "Sam and Alex" is people saying they already buy for each other, not
  // people nominating a direction.
  function allowedTable(names, pairs) {
    var n = names.length;
    var allowed = [];
    var i, j;
    for (i = 0; i < n; i++) {
      allowed.push([]);
      for (j = 0; j < n; j++) allowed[i].push(i !== j);
    }
    pairs.forEach(function (pair) {
      allowed[pair[0]][pair[1]] = false;
      allowed[pair[1]][pair[0]] = false;
    });
    return allowed;
  }

  // Kuhn's algorithm for a perfect matching in the bipartite graph of givers
  // against receivers. This is the honest part of the tool: shuffling and
  // retrying can only ever say "I did not manage it", and on a tight set of
  // exclusions it says that after spinning forever. An augmenting-path search
  // is complete, so when it fails it has *proved* there is no assignment, and
  // the tool can say which it is.
  function perfectMatching(allowed) {
    var n = allowed.length;
    var takenBy = [];
    var i;
    for (i = 0; i < n; i++) takenBy.push(-1);

    function augment(giver, seen) {
      // Randomised so that a solvable-but-tight list still gets a different
      // answer each time rather than the same canonical one.
      var order = R.shuffle(takenBy.map(function (_, idx) { return idx; }));
      for (var k = 0; k < n; k++) {
        var receiver = order[k];
        if (!allowed[giver][receiver] || seen[receiver]) continue;
        seen[receiver] = true;
        if (takenBy[receiver] === -1 || augment(takenBy[receiver], seen)) {
          takenBy[receiver] = giver;
          return true;
        }
      }
      return false;
    }

    for (i = 0; i < n; i++) {
      var seen = [];
      for (var j = 0; j < n; j++) seen.push(false);
      if (!augment(i, seen)) return null; // proved: no assignment exists
    }

    var giving = [];
    for (i = 0; i < n; i++) giving.push(-1);
    for (i = 0; i < n; i++) giving[takenBy[i]] = i;
    return giving;
  }

  // The fast path first: a plain shuffle is uniform over the valid assignments
  // in a way an augmenting-path search is not, and with no exclusions it lands
  // on the first or second go. The matching is the fallback and the arbiter.
  function drawSanta(allowed) {
    var n = allowed.length;
    var indices = [];
    var i;
    for (i = 0; i < n; i++) indices.push(i);

    for (var attempt = 0; attempt < 200; attempt++) {
      var perm = R.shuffle(indices);
      var ok = true;
      for (i = 0; i < n; i++) {
        if (!allowed[i][perm[i]]) { ok = false; break; }
      }
      if (ok) return { giving: perm, viaShuffle: true };
    }

    var matched = perfectMatching(allowed);
    return matched ? { giving: matched, viaShuffle: false } : null;
  }

  function initSanta() {
    var namesEl = $("ss-names");
    if (!namesEl) return;

    var exclusionsEl = $("ss-exclusions");
    var generateBtn = $("ss-generate-btn");
    var resultsEl = $("ss-results");
    var messageEl = $("ss-message");
    var setupEl = $("ss-setup");
    var revealEl = $("ss-reveal");
    var revealWhoEl = $("ss-reveal-who");
    var revealBtn = $("ss-reveal-btn");
    var revealNameEl = $("ss-reveal-name");
    var copyAllInput = $("ss-all-links");
    var copyAllBtn = $("ss-copy-all");
    var copyAllWrap = $("ss-all-wrap");

    // Someone opening their own link wants one name and nothing else: the
    // organiser's whole workspace would spoil it, so it does not load.
    var toParam = qsp.get("to");
    if (toParam) {
      var recipient = "";
      var giver = "";
      try {
        recipient = decodeName(toParam);
        if (qsp.get("who")) giver = decodeName(qsp.get("who"));
      } catch (e) {
        recipient = "";
      }
      if (recipient) {
        setupEl.hidden = true;
        revealEl.hidden = false;
        revealWhoEl.textContent = giver ? giver + ", you are buying for…" : "You are buying for…";
        revealBtn.addEventListener("click", function () {
          revealNameEl.textContent = recipient;
          revealNameEl.hidden = false;
          revealBtn.hidden = true;
        });
        return;
      }
      messageEl.textContent = "That link could not be read. Ask whoever organised it to send it again.";
    }

    generateBtn.addEventListener("click", function () {
      var names = parseList(namesEl.value);
      messageEl.textContent = "";
      resultsEl.innerHTML = "";
      copyAllInput.value = "";
      copyAllWrap.hidden = true;

      if (names.length < 3) {
        messageEl.textContent = "Secret Santa needs at least 3 people — with two, each would simply have the other.";
        return;
      }
      if (names.length > 200) {
        messageEl.textContent = "That is " + names.length + " people, and 200 is the limit here.";
        return;
      }

      var lower = names.map(function (s) { return s.toLowerCase(); });
      var dupes = names.filter(function (s, i) { return lower.indexOf(s.toLowerCase()) !== i; });
      if (dupes.length) {
        messageEl.textContent = "Two people are listed as “" + dupes[0] +
          "”. Names have to be distinguishable, or nobody knows whose link is whose.";
        return;
      }

      // Exclusions are "A, B" a line. Unknown names are the usual failure and
      // they are worth naming, because a silent typo becomes a pairing someone
      // was promised would not happen.
      var pairs = [];
      var unknown = [];
      var malformed = 0;
      parseList(exclusionsEl.value).forEach(function (line) {
        var parts = line.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s.length; });
        if (parts.length !== 2) { malformed++; return; }
        var a = lower.indexOf(parts[0].toLowerCase());
        var b = lower.indexOf(parts[1].toLowerCase());
        if (a === -1) unknown.push(parts[0]);
        if (b === -1) unknown.push(parts[1]);
        if (a !== -1 && b !== -1 && a !== b) pairs.push([a, b]);
      });
      if (unknown.length) {
        messageEl.textContent = "Not on the list: “" + unknown.join("”, “") +
          "”. Check the spelling — an exclusion that does not match a name does nothing.";
        return;
      }
      if (malformed) {
        messageEl.textContent = "Each exclusion is two names on one line, separated by a comma — " +
          malformed + (malformed === 1 ? " line is not." : " lines are not.");
        return;
      }

      var allowed = allowedTable(names, pairs);
      var drawn = drawSanta(allowed);
      if (!drawn) {
        messageEl.textContent = "These exclusions cannot all be met — there is no assignment at all, " +
          "not merely a hard one. Someone has been ruled out of everybody, or a group has been " +
          "fenced off so tightly that it cannot give outside itself. Remove an exclusion and try again.";
        return;
      }

      var origin = window.location.origin;
      var allLines = [];
      names.forEach(function (giverName, i) {
        var link = origin + "/secret-santa/?to=" + encodeName(names[drawn.giving[i]]) +
          "&who=" + encodeName(giverName);
        allLines.push(giverName + ": " + link);

        var row = document.createElement("div");
        row.className = "santa-row";
        var who = document.createElement("span");
        who.className = "santa-who";
        who.textContent = giverName;
        var input = document.createElement("input");
        input.type = "text";
        input.readOnly = true;
        input.value = link;
        input.setAttribute("aria-label", "Secret Santa link for " + giverName);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-ghost";
        btn.textContent = "Copy";
        wireCopyButton(btn, input);
        row.appendChild(who);
        row.appendChild(input);
        row.appendChild(btn);
        resultsEl.appendChild(row);
      });
      copyAllInput.value = allLines.join("\n");
      copyAllWrap.hidden = false;
    });

    wireCopyButton(copyAllBtn, copyAllInput);
  }

  // -------------------------------------------------------------- rota --

  // Deal whole rounds. Everybody appears once per round, so after any number of
  // slots the busiest person is at most one turn ahead of the quietest — that
  // is what "evenly" has to mean, and picking a name at random per slot does
  // not give it. Within a round nobody repeats; the only place a repeat can
  // happen is across a round boundary, so that is the only place to look.
  function buildRota(people, slotCount, avoidRepeat) {
    var out = [];
    while (out.length < slotCount) {
      var round = R.shuffle(people);
      if (avoidRepeat && out.length && round.length > 1 && round[0] === out[out.length - 1]) {
        var j = R.int(1, round.length - 1);
        var tmp = round[0];
        round[0] = round[j];
        round[j] = tmp;
      }
      for (var i = 0; i < round.length && out.length < slotCount; i++) out.push(round[i]);
    }
    return out;
  }

  function initRota() {
    var peopleEl = $("ro-people");
    if (!peopleEl) return;

    var slotsCountEl = $("ro-slots");
    var slotNamesEl = $("ro-slot-names");
    var avoidEl = $("ro-avoid");
    var generateBtn = $("ro-generate-btn");
    var resultsEl = $("ro-results");
    var tallyEl = $("ro-tally");
    var messageEl = $("ro-message");
    var shareInput = $("ro-share-url");
    var shareBtn = $("ro-copy-link");

    var peopleParam = qsp.get("people");
    var slotsParam = qsp.get("slots");
    if (peopleParam) {
      peopleEl.value = peopleParam.split(",").map(function (s) { return decodeURIComponent(s.trim()); }).join("\n");
    }
    if (slotsParam) slotsCountEl.value = slotsParam;
    if (qsp.get("norepeat") === "0") avoidEl.checked = false;

    function updateShare() {
      setShareUrl(shareInput, "/rota-builder", {
        people: parseList(peopleEl.value).map(encodeURIComponent).join(","),
        slots: slotsCountEl.value,
        norepeat: avoidEl.checked ? "" : "0",
      });
    }
    peopleEl.addEventListener("input", updateShare);
    slotsCountEl.addEventListener("input", updateShare);
    avoidEl.addEventListener("change", updateShare);

    generateBtn.addEventListener("click", function () {
      var people = parseList(peopleEl.value);
      var labels = parseList(slotNamesEl.value);
      var slotCount = labels.length || Math.max(1, Math.min(365, parseInt(slotsCountEl.value, 10) || 12));
      messageEl.textContent = "";
      resultsEl.innerHTML = "";
      tallyEl.innerHTML = "";

      if (!people.length) {
        messageEl.textContent = "Add the people who are in the rota.";
        return;
      }
      var avoid = avoidEl.checked;
      if (avoid && people.length < 2) {
        messageEl.textContent = "With one person on the list every slot is theirs, so nobody can avoid going twice in a row. Turned that off for this run.";
        avoid = false;
      }

      var rota = buildRota(people, slotCount, avoid);

      rota.forEach(function (person, i) {
        var row = document.createElement("div");
        row.className = "rota-row";
        var slot = document.createElement("span");
        slot.className = "rota-slot";
        slot.textContent = labels.length ? labels[i] : "Slot " + (i + 1);
        var who = document.createElement("span");
        who.className = "rota-who";
        who.textContent = person;
        row.appendChild(slot);
        row.appendChild(who);
        resultsEl.appendChild(row);
      });

      // The count is the claim the tool is making, so it prints it.
      var counts = {};
      rota.forEach(function (p) { counts[p] = (counts[p] || 0) + 1; });
      people.forEach(function (p) {
        var li = document.createElement("li");
        li.textContent = p + " × " + (counts[p] || 0);
        tallyEl.appendChild(li);
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
    initBracket();
    initSanta();
    initRota();
  });
})();
