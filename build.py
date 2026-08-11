#!/usr/bin/env python3
"""
One-off generator for drawlots.net's static pages. Produces plain HTML files
with zero templating at request time — the shipped site has no build step.
This script is deleted after the output is committed (see the bottom of
this file's companion commit).

Clean-path implementation note: GitHub Pages serves a truly extensionless
file (no directory, no extension) with Content-Type: application/octet-stream,
which real browsers treat as a forced download on navigation. The correct
static-host pattern for clean URLs is a directory containing index.html —
GitHub Pages 301-redirects "/slug" -> "/slug/" and serves that index.html
with the correct "text/html" content type. So every tool/legal page ships as
BOTH "<slug>/index.html" (the true clean path, trailing slash) AND
"<slug>.html" (a flat, real .html alias, also correctly text/html).
"""
import os
import json

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = "https://drawlots.net"
TODAY = "2026-07-18"

# ---------------------------------------------------------------- tools --

TOOLS = [
    dict(
        slug="spinner-wheel",
        name="Spinner Wheel",
        tagline="Type your options, spin, let the wheel decide.",
        description="Free customizable spinner wheel. Type any list of options, spin, and a cryptographically random winner is drawn — share the wheel by link. No sign-up, runs entirely in your browser.",
        icon='<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 3"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
        intro="Type your options into the list, one per line, then spin — the wheel is divided evenly and a winner is drawn using your browser's cryptographic random number generator, not a fake weighted animation. Share the exact wheel you built with a link.",
        how_to=[
            "Edit the list of entries, one option per line — add as many as you like.",
            "Click “Spin the wheel” and watch it spin down to a stop.",
            "The winning entry is announced below the wheel once it settles.",
            "Turn on “Remove winner after spin” to run an elimination draw, or use “Copy link” to send this exact wheel to someone else.",
        ],
        faq=[
            ("Is the spin actually random, or just an animation?", "The winning entry is chosen first, using crypto.getRandomValues (the same cryptographic randomness browsers use for security), and the wheel's spin animation is calculated to land on that already-chosen result. The spin is theater; the choice is not."),
            ("How many entries can I add?", "As many as fit on one line each — the wheel redraws itself to fit any number of segments, though it reads best with 20 or fewer."),
            ("Can I send this exact wheel to someone else?", "Yes — click “Copy link” and your current list of entries is encoded right into the URL. Opening that link loads the same wheel, ready to spin."),
            ("Does spinning save or upload my list anywhere?", "No. Everything — the list, the random draw, the animation — runs in your browser tab. Nothing is sent anywhere unless you choose to share the link yourself."),
        ],
        related=["random-name-picker", "dice-roller", "team-generator"],
        workspace="""
    <div class="wheel-stage">
      <div class="wheel-frame">
        <svg class="wheel-pointer" width="26" height="30" viewBox="0 0 26 30" aria-hidden="true"><path d="M13 30L0 6a13 13 0 0126 0z" fill="var(--accent)"/></svg>
        <canvas id="sw-canvas" width="340" height="340" role="img" aria-label="Spinner wheel"></canvas>
        <div class="wheel-hub"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 3"/></svg></div>
      </div>
    </div>
    <div class="field">
      <label for="sw-entries">Entries (one per line)</label>
      <textarea id="sw-entries" rows="6">Pizza
Tacos
Sushi
Burgers
Salad
Ramen</textarea>
    </div>
    <div class="btn-row">
      <button type="button" class="btn" id="sw-spin-btn">Spin the wheel</button>
      <label class="checkbox-field"><input type="checkbox" id="sw-remove-winner"> Remove winner after spin</label>
    </div>
    <p class="tool-message" id="sw-message" role="status"></p>
    <div class="result-banner" id="sw-result" hidden>
      <span class="result-label">Winner</span>
      <span class="result-value" id="sw-winner-text"></span>
    </div>
    <div class="share-row">
      <input type="text" id="sw-share-url" readonly aria-label="Shareable link for this wheel">
      <button type="button" class="btn-ghost" id="sw-copy-link">Copy link</button>
    </div>
""",
    ),
    dict(
        slug="random-name-picker",
        name="Random Name Picker",
        tagline="One list in, one fair pick out.",
        description="Free random name picker. Paste a list of names and draw one at random, fairly — good for raffles, calling on students, or choosing who goes first. Share the list by link.",
        icon='<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="7.6" cy="9.6" r="1.4" fill="currentColor" stroke="none"/><path d="M7 19v-2.6a2.6 2.6 0 015.2 0V19"/>',
        intro="Paste in a list of names, one per line, and draw one at random — each name has an equal, cryptographically random chance. Good for raffles, picking who presents first, or settling an argument about who does the dishes.",
        how_to=[
            "Type or paste your list of names, one per line.",
            "Click “Pick a name” and watch the names flicker before landing on the winner.",
            "Turn on “Remove picked name” to draw again without repeats — useful for going through a whole list in random order.",
            "Use “Copy link” to share this exact list with someone else.",
        ],
        faq=[
            ("Does every name have an equal chance?", "Yes — the picker draws a single uniformly random index using crypto.getRandomValues across however many names you've entered, so every name has exactly a 1-in-N chance regardless of order or length."),
            ("Can I use this to draw an order for a whole group, one at a time?", "Yes — check “Remove picked name from the list” before picking. Each pick removes that name, so repeated picks work through the group in a fair random order."),
            ("Is there a limit to how many names I can add?", "No hard limit — add one name per line, as many as you need."),
            ("Do the names get uploaded anywhere?", "No. The list stays in your browser tab. The only way it leaves your device is if you deliberately copy and share the link, which encodes the list in the URL itself."),
        ],
        related=["spinner-wheel", "team-generator", "coin-flip"],
        workspace="""
    <div class="field">
      <label for="np-names">Names (one per line)</label>
      <textarea id="np-names" rows="6">Alex
Jordan
Taylor
Morgan
Casey
Riley</textarea>
    </div>
    <div class="btn-row">
      <button type="button" class="btn" id="np-pick-btn">Pick a name</button>
      <label class="checkbox-field"><input type="checkbox" id="np-remove-winner"> Remove picked name from the list</label>
    </div>
    <p class="tool-message" id="np-message" role="status"></p>
    <div class="result-banner" id="np-result" hidden>
      <span class="result-label">Picked</span>
      <span class="result-value flicker-name" id="np-winner-text"></span>
    </div>
    <div class="share-row">
      <input type="text" id="np-share-url" readonly aria-label="Shareable link for this list">
      <button type="button" class="btn-ghost" id="np-copy-link">Copy link</button>
    </div>
""",
    ),
    dict(
        slug="dice-roller",
        name="Dice Roller",
        tagline="Tumble any dice, from a d4 to a d20.",
        description="Free online dice roller for d4, d6, d8, d10, d12 and d20 — roll 1 to 6 dice at once with a real tumble animation and running total. Cryptographically random, no app or physical dice needed.",
        icon='<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/>',
        intro="Choose how many dice and what kind — d4 through d20 — then roll. Each die tumbles into a genuinely random result and the total adds itself up, so you can settle a tabletop rule or a bet without digging through a dice bag.",
        how_to=[
            "Pick how many dice to roll and how many sides each one has.",
            "Click “Roll”. Each die tumbles and lands on its result.",
            "The sum of all dice appears below the tray.",
            "Change the count or sides at any time and roll again.",
        ],
        faq=[
            ("Are these dice actually fair?", "Yes — each die's result is drawn independently with crypto.getRandomValues using rejection sampling, so every face has exactly an equal 1-in-N chance with no bias toward any number."),
            ("What's the difference between d6 and d20?", "The number is how many sides (and possible outcomes) that die has — a d6 is a standard six-sided cube, a d20 is the twenty-sided die common in tabletop role-playing games. This tool supports d4, d6, d8, d10, d12 and d20."),
            ("Can I roll more than 6 dice at once?", "The tray supports up to 6 dice per roll to keep results easy to read at a glance — roll twice and add the totals if you need more."),
            ("Does the tumble animation affect the result?", "No — the result for each die is decided the instant you click Roll. The tumble is a visual flourish and is skipped automatically if your system has reduced motion turned on."),
        ],
        related=["coin-flip", "random-number-generator", "spinner-wheel"],
        workspace="""
    <div class="dice-tray" id="dr-tray" aria-live="polite"></div>
    <p class="dice-total" id="dr-total-wrap" hidden>Total: <strong id="dr-total">0</strong></p>
    <div class="controls-row">
      <div class="field">
        <label for="dr-count">Number of dice</label>
        <select id="dr-count">
          <option value="1">1</option>
          <option value="2" selected>2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>
      </div>
      <div class="field">
        <label for="dr-sides">Sides per die</label>
        <select id="dr-sides">
          <option value="4">d4</option>
          <option value="6" selected>d6</option>
          <option value="8">d8</option>
          <option value="10">d10</option>
          <option value="12">d12</option>
          <option value="20">d20</option>
        </select>
      </div>
    </div>
    <div class="btn-row"><button type="button" class="btn" id="dr-roll-btn">Roll</button></div>
    <div class="share-row">
      <input type="text" id="dr-share-url" readonly aria-label="Shareable link for this setup">
      <button type="button" class="btn-ghost" id="dr-copy-link">Copy link</button>
    </div>
""",
    ),
    dict(
        slug="coin-flip",
        name="Coin Flip",
        tagline="Heads or tails, flipped in 3D.",
        description="Free online coin flip with a real 3D tumbling animation. Flip one coin or a batch at once, cryptographically random, with a running heads/tails tally. No app, no physical coin needed.",
        icon='<circle cx="12" cy="12" r="9"/><path d="M9 10a3 3 0 016 0c0 2-3 2.2-3 4.4"/><circle cx="12" cy="17" r=".35" fill="currentColor" stroke="none"/>',
        intro="Flip a coin the moment you need one — heads or tails, chosen with cryptographic randomness and shown with a real 3D flip. Flip a batch at once when you need more than one call, and keep a running tally as you go.",
        how_to=[
            "Choose how many coins to flip at once — from 1 up to 10.",
            "Click “Flip” and watch the coin tumble to a result.",
            "For a single coin, the result reads Heads or Tails; for a batch, you'll see the split, e.g. “6 heads, 4 tails”.",
            "The running tally below keeps count across every flip until you reset it.",
        ],
        faq=[
            ("Is this really 50/50?", "Yes — each flip draws one bit of cryptographic randomness (crypto.getRandomValues), giving heads and tails an exactly equal chance every time, independent of any previous flip."),
            ("If I just got 5 heads in a row, is tails more likely next?", "No — this is the gambler's fallacy. Each flip is completely independent of the last; the coin has no memory. Five heads in a row is unlikely as a run, but the sixth flip is still exactly 50/50."),
            ("What does flipping a batch show me?", "Flipping more than one coin at once shows how many landed heads versus tails in that batch, and adds all of them to the running tally below."),
            ("Does the tally save between visits?", "No — the tally is only kept for your current visit to the page and resets when you reload or click Reset tally."),
        ],
        related=["dice-roller", "random-number-generator", "random-name-picker"],
        workspace="""
    <div class="coin-stage">
      <div class="coin-perspective">
        <div class="coin" id="cf-coin">
          <div class="coin-face heads"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M9 10a3 3 0 016 0c0 2-3 2.2-3 4.4"/><circle cx="12" cy="17" r=".3" fill="currentColor"/></svg>Heads</div>
          <div class="coin-face tails"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5l1.4 4.2L18 10l-3.4 2.6 1 4.2L12 14.5 8.4 16.8l1-4.2L6 10l4.6-.8z"/></svg>Tails</div>
        </div>
      </div>
      <div class="controls-row" style="justify-content:center">
        <div class="field">
          <label for="cf-count">Flip how many</label>
          <select id="cf-count">
            <option value="1" selected>1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </div>
      </div>
      <div class="btn-row"><button type="button" class="btn" id="cf-flip-btn">Flip</button></div>
      <div class="result-banner" id="cf-result" hidden>
        <span class="result-label">Result</span>
        <span class="result-value" id="cf-result-text"></span>
      </div>
      <div class="coin-tally">
        <span>Heads <strong id="cf-heads-count">0</strong></span>
        <span>Tails <strong id="cf-tails-count">0</strong></span>
        <button type="button" class="btn-ghost" id="cf-reset">Reset tally</button>
      </div>
    </div>
""",
    ),
    dict(
        slug="random-number-generator",
        name="Random Number Generator",
        tagline="Pick a range, draw one number or twenty.",
        description="Free random number generator. Set a minimum and maximum, draw one number or a batch, with optional decimals and no-repeat mode. Cryptographically random, shareable by link.",
        icon='<path d="M4 9h16M4 15h16M9 4L7 20M17 4l-2 16"/>',
        intro="Set a minimum and maximum and draw a number — or several at once. Turn on “No repeats” to draw a unique batch, like numbers for a raffle, or allow decimals for a precise random value in a range.",
        how_to=[
            "Enter a minimum and maximum value.",
            "Set how many numbers to draw at once, from 1 to 20.",
            "Optionally turn on “No repeats” for a unique batch, or “Allow decimals” for a non-whole-number result.",
            "Click “Generate” — each result rolls briefly before settling on its final value.",
        ],
        faq=[
            ("Is every number in the range equally likely?", "Yes — integers are drawn with crypto.getRandomValues using rejection sampling, which removes the small bias a naive modulo approach would introduce, so every whole number in your range has an equal chance."),
            ("What happens if I ask for more unique numbers than fit in the range?", "The tool tells you the range doesn't contain enough whole numbers for the batch you asked for, rather than silently repeating a value or failing quietly."),
            ("Can I generate decimals, like a price or a measurement?", "Yes — turn on “Allow decimals” and choose 1 or 2 decimal places; the result is a random value anywhere in your range rather than only whole numbers."),
            ("Can I share the exact range I set up?", "Yes — “Copy link” encodes your minimum, maximum and count into the URL so anyone opening it starts from the same setup."),
        ],
        related=["dice-roller", "coin-flip", "team-generator"],
        workspace="""
    <div class="controls-row">
      <div class="field"><label for="rng-min">Minimum</label><input type="number" id="rng-min" value="1"></div>
      <div class="field"><label for="rng-max">Maximum</label><input type="number" id="rng-max" value="100"></div>
      <div class="field"><label for="rng-count">How many numbers</label><input type="number" id="rng-count" min="1" max="20" value="1"></div>
    </div>
    <div class="controls-row">
      <label class="checkbox-field"><input type="checkbox" id="rng-unique"> No repeats</label>
      <label class="checkbox-field"><input type="checkbox" id="rng-decimal"> Allow decimals</label>
      <div class="field" id="rng-places-field" hidden>
        <label for="rng-places">Decimal places</label>
        <select id="rng-places"><option value="1">1</option><option value="2">2</option></select>
      </div>
    </div>
    <div class="btn-row"><button type="button" class="btn" id="rng-generate-btn">Generate</button></div>
    <p class="tool-message" id="rng-message" role="status"></p>
    <div class="rng-display" id="rng-display" aria-live="polite"></div>
    <div class="share-row">
      <input type="text" id="rng-share-url" readonly aria-label="Shareable link for this range">
      <button type="button" class="btn-ghost" id="rng-copy-link">Copy link</button>
    </div>
""",
    ),
    dict(
        slug="team-generator",
        name="Team Generator",
        tagline="One list, split fairly into N teams.",
        description="Free random team generator. Paste a list of names, choose how many teams, and split the group fairly at random. Great for sports, classrooms, and game nights. Shareable by link.",
        icon='<circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3.3 2.7-6 5.5-6s5.5 2.7 5.5 6"/><circle cx="17.5" cy="9" r="2.3"/><path d="M15.8 20c.2-2.6 1.9-4.7 4-5.3"/>',
        intro="Paste in everyone's name, pick how many teams you need, and the group gets shuffled and split as evenly as possible — no more picking captains and going one by one.",
        how_to=[
            "Paste or type the full list of names, one per line.",
            "Set how many teams to split them into.",
            "Click “Split into teams” — the list is shuffled and divided as evenly as the numbers allow.",
            "Click again any time for a fresh random split.",
        ],
        faq=[
            ("How are teams kept even when the numbers don't divide evenly?", "Names are shuffled with a cryptographically random Fisher-Yates shuffle, then dealt out to teams one at a time in order — like dealing cards — so team sizes never differ by more than one person."),
            ("Can I control who ends up on which team?", "No — the whole point is a fair, unbiased split. If you need to keep specific people apart or together, adjust the input list and re-split, or handle that pairing manually afterward."),
            ("What's the maximum number of teams?", "Up to 10 teams at once, and you'll need at least as many names as teams."),
            ("Can I send this exact split to my group?", "Yes — “Copy link” encodes your name list and team count into the URL. Anyone opening it can generate their own random split from the same list, or you can share a screenshot of the result."),
        ],
        related=["random-name-picker", "spinner-wheel", "random-number-generator"],
        workspace="""
    <div class="field">
      <label for="tg-names">Names to split (one per line)</label>
      <textarea id="tg-names" rows="7">Alex
Jordan
Taylor
Morgan
Casey
Riley
Sam
Drew</textarea>
    </div>
    <div class="controls-row">
      <div class="field"><label for="tg-teams">Number of teams</label><input type="number" id="tg-teams" min="2" max="10" value="2"></div>
    </div>
    <div class="btn-row"><button type="button" class="btn" id="tg-generate-btn">Split into teams</button></div>
    <p class="tool-message" id="tg-message" role="status"></p>
    <div class="teams-grid" id="tg-results"></div>
    <div class="share-row">
      <input type="text" id="tg-share-url" readonly aria-label="Shareable link for this list">
      <button type="button" class="btn-ghost" id="tg-copy-link">Copy link</button>
    </div>
""",
    ),
    dict(
        slug="tournament-bracket",
        name="Tournament Bracket Generator",
        tagline="Names in, a seeded knockout bracket out — byes and all.",
        description="Free tournament bracket generator. Paste your entrants, get a printable single-elimination bracket with the byes given to the top seeds, random or listed seeding. No signup, entirely in your browser.",
        icon='<path d="M4 5h5v6h6V5h5"/><path d="M9 11v8h6v-8"/><circle cx="12" cy="21" r="1.6"/>',
        intro="Paste in everyone playing and get a proper single-elimination bracket — drawn at random or seeded in the order you listed, with the byes handed out the way a tournament actually hands them out. Print it and pin it up.",
        how_to=[
            "Paste or type the entrants, one per line.",
            "Choose a random draw, or “as listed” if the order you typed is the seeding.",
            "Click “Draw the bracket” — the sheet appears with every round and every line to fill in.",
            "Print it, or copy the link to send the same entrant list to someone else.",
        ],
        faq=[
            ("What happens when the number of entrants isn't a power of two?", "The bracket is expanded to the next power of two and the empty places become byes — a free walkover into round two. They are not scattered at random: they go to the top seeds, one each. With six entrants in a bracket of eight there are two byes, and they belong to seeds 1 and 2. With five entrants there are three, and seeds 1, 2 and 3 sit out the first round."),
            ("How does the seeding work?", "The standard draw order, the one printed on every tournament sheet: seed 1 and seed 2 can only meet in the final, seeds 3 and 4 can only reach them in the semis, and seed 1 opens against the lowest seed in the draw. Pick “random” and the entrant list is shuffled first, so the seeding is a fair draw rather than the order you happened to type."),
            ("Is double elimination supported?", "No — this draws single elimination only. A losers' bracket is a genuinely different sheet rather than an option on this one, so rather than half-do it, it is left out."),
            ("Can I print the bracket?", "Yes. Printing the page gives you the bracket on its own — the nav, the form and the notes are all dropped — so it comes out as a sheet you can pin up and write results on."),
        ],
        related=["team-generator", "random-name-picker", "rota-builder"],
        workspace="""
    <div class="field">
      <label for="br-names">Entrants (one per line)</label>
      <textarea id="br-names" rows="7">Alex
Jordan
Taylor
Morgan
Casey
Riley</textarea>
    </div>
    <div class="controls-row">
      <div class="field"><label for="br-seeding">Seeding</label><select id="br-seeding">
        <option value="random">Random draw</option>
        <option value="listed">As listed &mdash; first line is the top seed</option>
      </select></div>
    </div>
    <div class="btn-row"><button type="button" class="btn" id="br-generate-btn">Draw the bracket</button></div>
    <p class="tool-message" id="br-message" role="status"></p>
    <p class="bracket-summary" id="br-summary"></p>
    <div class="bracket-wrap" id="br-results"></div>
    <div class="share-row">
      <input type="text" id="br-share-url" readonly aria-label="Shareable link for this entrant list">
      <button type="button" class="btn-ghost" id="br-copy-link">Copy link</button>
    </div>
""",
    ),
    dict(
        slug="secret-santa",
        name="Secret Santa Generator",
        tagline="Draw names with exclusions, and a private link for each person.",
        description="Free Secret Santa generator with exclusions, so couples and housemates never draw each other. Nobody draws themselves, and each person gets their own link showing only their name. No email, no signup, entirely in your browser.",
        icon='<path d="M20 12v8H4v-8"/><path d="M2 8h20v4H2z"/><path d="M12 8v12"/><path d="M12 8S10.5 4 8.5 4a2.5 2.5 0 0 0 0 5"/><path d="M12 8s1.5-4 3.5-4a2.5 2.5 0 0 1 0 5"/>',
        intro="Paste in everyone taking part, add any pairs who must not draw each other, and everyone gets a private link showing only the name they drew. You can run it without ever seeing the pairings yourself.",
        how_to=[
            "Paste in everyone taking part, one name per line.",
            "Add any pairs who must not draw each other — two names on a line, separated by a comma.",
            "Click “Draw the names”. Nobody gets themselves and no exclusion is broken.",
            "Send each person their own link. It shows one name, behind a click, and nothing else.",
        ],
        faq=[
            ("How do the exclusions work?", "Put two names on one line separated by a comma and neither will draw the other — it cuts both ways, because “Sam and Alex” is normally a couple who already buy for each other rather than a one-way rule. A name that doesn't match your list is flagged rather than silently ignored, since a typo in an exclusion is exactly how the pairing you promised wouldn't happen happens."),
            ("What if my exclusions are impossible?", "It says so, and it means it. Shuffling and retrying can only ever report that it didn't manage — and on a tight set of exclusions it reports that after spinning forever. This searches for a valid assignment properly, so when it says there isn't one it has proved it. Three people who can each only give to the same fourth person is impossible, and you get told that rather than a spinner."),
            ("Can the organiser avoid seeing who has who?", "Mostly. The results are a list of links, one per person, and the names inside them are encoded rather than printed — so you can send them out without reading them. Be straight about the limit though: the link has to carry the name, and anyone determined enough can decode it. It stops you seeing it by accident; it is not a secret kept from you."),
            ("Does anything get emailed or stored?", "No. There is no server, no account and no email — the draw happens in this tab and the links are just text. Send them however you like: chat, text, or written on the back of an envelope."),
        ],
        related=["random-name-picker", "team-generator", "spinner-wheel"],
        workspace="""
    <div id="ss-setup">
      <div class="field">
        <label for="ss-names">Everyone taking part (one per line)</label>
        <textarea id="ss-names" rows="7">Alex
Jordan
Taylor
Morgan
Casey
Riley</textarea>
      </div>
      <div class="field">
        <label for="ss-exclusions">Who must not draw each other (two names a line, separated by a comma)</label>
        <textarea id="ss-exclusions" rows="3" placeholder="Alex, Jordan"></textarea>
      </div>
      <div class="btn-row"><button type="button" class="btn" id="ss-generate-btn">Draw the names</button></div>
      <p class="tool-message" id="ss-message" role="status"></p>
      <div class="santa-list" id="ss-results"></div>
      <div id="ss-all-wrap" hidden>
        <div class="field">
          <label for="ss-all-links">Every link, one per line</label>
          <textarea id="ss-all-links" rows="4" readonly></textarea>
        </div>
        <div class="btn-row"><button type="button" class="btn-ghost" id="ss-copy-all">Copy every link</button></div>
      </div>
    </div>
    <div class="santa-reveal" id="ss-reveal" hidden>
      <p class="santa-reveal-who" id="ss-reveal-who"></p>
      <button type="button" class="btn" id="ss-reveal-btn">Reveal the name I drew</button>
      <p class="santa-reveal-name" id="ss-reveal-name" hidden></p>
    </div>
""",
    ),
    dict(
        slug="rota-builder",
        name="Rota Builder",
        tagline="People across slots, evenly, and never twice in a row.",
        description="Free random rota and schedule generator. Share chores, on-call weeks or a reading order across any number of slots — evenly, at random, and optionally never the same person twice running. Entirely in your browser.",
        icon='<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13h3M13.5 13h3M7.5 17h3"/>',
        intro="Chores, on-call weeks, who reads next — one list of people, however many slots you need, dealt out at random but evenly, so nobody quietly ends up with twice as many turns as everyone else.",
        how_to=[
            "Paste in the people who are in the rota, one per line.",
            "Set how many slots to fill, or name them — Mon, Tue, Wed, or Week 1 to Week 12.",
            "Leave “never the same person twice in a row” on unless back-to-back turns are fine.",
            "Click “Build the rota”. The tally underneath shows how many turns each person got.",
        ],
        faq=[
            ("What does “evenly” actually mean here?", "That the busiest person is at most one turn ahead of the quietest, always. The rota is dealt in whole rounds — everybody once per round, in a fresh random order each time — rather than picking a name at random for each slot, which is what leaves someone with five turns and someone else with one. Only the last, part-finished round can give anyone that extra turn, and who gets it is random."),
            ("How does it stop the same person going twice in a row?", "Within a round it cannot happen, because everyone appears exactly once. The only place it can is where one round ends and the next begins, so if the new round would open with whoever just finished, they are swapped with someone else in that round. That keeps the round intact, so the even distribution survives."),
            ("Can I name the slots?", "Yes — put them in the slot names box, one per line, and they become the rota. Mon to Fri, Week 1 to Week 12, or the actual dates. Leave it empty and you get numbered slots instead."),
            ("Can one person have more turns than another on purpose?", "No — the point here is an even, unbiased share. If someone should carry a heavier load, run the rota for the people on equal footing and add the rest by hand."),
        ],
        related=["team-generator", "random-name-picker", "tournament-bracket"],
        workspace="""
    <div class="field">
      <label for="ro-people">People in the rota (one per line)</label>
      <textarea id="ro-people" rows="6">Alex
Jordan
Taylor
Morgan</textarea>
    </div>
    <div class="controls-row">
      <div class="field"><label for="ro-slots">How many slots</label><input type="number" id="ro-slots" min="1" max="365" value="12"></div>
    </div>
    <div class="field">
      <label for="ro-slot-names">Slot names (optional, one per line &mdash; these replace the count above)</label>
      <textarea id="ro-slot-names" rows="3" placeholder="Mon&#10;Tue&#10;Wed"></textarea>
    </div>
    <div class="btn-row">
      <button type="button" class="btn" id="ro-generate-btn">Build the rota</button>
      <label class="checkbox-field"><input type="checkbox" id="ro-avoid" checked> Never the same person twice in a row</label>
    </div>
    <p class="tool-message" id="ro-message" role="status"></p>
    <div class="rota-list" id="ro-results"></div>
    <ul class="rota-tally" id="ro-tally"></ul>
    <div class="share-row">
      <input type="text" id="ro-share-url" readonly aria-label="Shareable link for this rota">
      <button type="button" class="btn-ghost" id="ro-copy-link">Copy link</button>
    </div>
""",
    ),
]

TOOLS_BY_SLUG = {t["slug"]: t for t in TOOLS}


def clean_url(slug):
    return "/" + slug + "/"


# --------------------------------------------------------------- shared --

NO_FLASH = """<script>(function(){try{var r=document.documentElement;var t=localStorage.getItem("drawlots-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}r.setAttribute("data-theme",t);}catch(e){}})();</script>"""

ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7560786263587509" crossorigin="anonymous"></script>'

ERABBIT = '<a href="https://erabb.it" class="erabbit-mark" aria-label="erabb.it"><img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>\U0001F407</text></svg>" width="10" height="10" alt=""></a>'

FAVICON = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect x=%226%22 y=%226%22 width=%2252%22 height=%2252%22 rx=%2214%22 fill=%22%23ff5d5d%22/><circle cx=%2220%22 cy=%2220%22 r=%226%22 fill=%22%23fff%22/><circle cx=%2232%22 cy=%2232%22 r=%226%22 fill=%22%23fff%22/><circle cx=%2244%22 cy=%2244%22 r=%226%22 fill=%22%23fff%22/></svg>'

THEME_ICON = '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/></svg>'


def nav_items(current):
    items = []
    home_current = current is None
    items.append(
        '<li><a href="/" data-panel-link=""{cur}>Home</a></li>'.format(
            cur=' aria-current="page"' if home_current else ""
        )
    )
    for t in TOOLS:
        cur = current == t["slug"]
        items.append(
            '<li><a href="{url}" data-panel-link="{slug}"{cur}>{name}</a></li>'.format(
                url=clean_url(t["slug"]), slug=t["slug"], name=t["name"],
                cur=' aria-current="page"' if cur else ""
            )
        )
    return "\n      ".join(items)


def header(current):
    return """  <header class="site-header">
    <div class="wrap">
      <a href="/" class="wordmark" data-panel-link="">draw<span class="dot">&bull;</span>lots</a>
      <ul class="tool-nav" id="tool-nav">
      {nav}
      </ul>
      <div class="header-controls">
        <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="tool-nav" aria-label="Toggle menu">&#9776;</button>
        <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle light and dark theme">{icon}</button>
      </div>
    </div>
  </header>""".format(nav=nav_items(current), icon=THEME_ICON)


def footer():
    return """  <footer class="site-footer">
    <div class="wrap">
      <p class="footer-tag">drawlots.net &mdash; nine ways to leave it to chance, entirely in your browser.</p>
      <ul class="footer-links">
        <li><a href="/articles/">Articles</a></li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
      </ul>
    </div>
  </footer>
{erabbit}""".format(erabbit=ERABBIT)


def head(title, description, canonical_path, json_ld, include_ads=True):
    canonical = SITE + canonical_path
    return """<head>
  {no_flash}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{canonical}">
  <link rel="icon" href="{favicon}">
  <meta name="theme-color" content="#14231d">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="drawlots.net">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <link rel="stylesheet" href="/assets/style.css">
  <script type="application/ld+json">{json_ld}</script>
  {adsense}
</head>""".format(
        no_flash=NO_FLASH,
        title=title,
        description=description,
        canonical=canonical,
        favicon=FAVICON,
        json_ld=json_ld,
        adsense=ADSENSE if include_ads else "",
    )


def scripts_tail():
    return '  <script src="/assets/random.js"></script>\n  <script src="/assets/tools.js"></script>\n  <script src="/assets/app.js"></script>'


def write(path, content):
    full = os.path.join(ROOT, path)
    d = os.path.dirname(full)
    if d:
        os.makedirs(d, exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)


def write_clean(slug, content):
    write(slug + "/index.html", content)
    write(slug + ".html", content)


def jstr(s):
    return json.dumps(s)


# ---------------------------------------------------------- hero signature --

HERO_LOTS_SVG = """    <div class="lots-stage" aria-hidden="true">
      <div class="lot-stick" style="--rot:-16deg"><svg width="14" height="150" viewBox="0 0 14 150"><rect x="4" y="0" width="6" height="150" rx="3" fill="var(--lot-sky)"/></svg></div>
      <div class="lot-stick" style="--rot:-8deg"><svg width="14" height="172" viewBox="0 0 14 172"><rect x="4" y="0" width="6" height="172" rx="3" fill="var(--lot-violet)"/></svg></div>
      <div class="lot-stick drawn" style="--rot:0deg"><svg width="16" height="194" viewBox="0 0 16 194"><rect x="4" y="0" width="8" height="194" rx="4" fill="var(--lot-coral)"/></svg></div>
      <div class="lot-stick" style="--rot:9deg"><svg width="14" height="160" viewBox="0 0 14 160"><rect x="4" y="0" width="6" height="160" rx="3" fill="var(--lot-mint)"/></svg></div>
      <div class="lot-stick" style="--rot:17deg"><svg width="14" height="144" viewBox="0 0 14 144"><rect x="4" y="0" width="6" height="144" rx="3" fill="var(--lot-gold)"/></svg></div>
      <p class="lots-hand-note">one lot, drawn</p>
    </div>"""


# ---------------------------------------------------------- tool pages --

def render_faq_jsonld(faq):
    entries = []
    for q, a in faq:
        entries.append(
            '{{"@type":"Question","name":{q},"acceptedAnswer":{{"@type":"Answer","text":{a}}}}}'.format(
                q=jstr(q), a=jstr(a)
            )
        )
    return "[" + ",".join(entries) + "]"


def tool_page(tool):
    canonical_path = clean_url(tool["slug"])
    title = "{name} — Free, Instant Random Tool | drawlots.net".format(name=tool["name"])
    json_ld = (
        '{{"@context":"https://schema.org","@type":"WebApplication","name":{name},'
        '"url":{url},"applicationCategory":"UtilitiesApplication","operatingSystem":"Any (runs in browser)",'
        '"description":{desc},"offers":{{"@type":"Offer","price":"0","priceCurrency":"USD"}},'
        '"publisher":{{"@type":"Organization","name":"drawlots.net"}}}}'
    ).format(
        name=jstr(tool["name"] + " — drawlots.net"),
        url=jstr(SITE + canonical_path),
        desc=jstr(tool["description"]),
    )
    faq_ld = '{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":{entities}}}'.format(
        entities=render_faq_jsonld(tool["faq"])
    )

    how_to_html = "\n".join("        <li>{}</li>".format(s) for s in tool["how_to"])
    faq_html = "\n".join(
        "        <dt>{}</dt>\n        <dd>{}</dd>".format(q, a) for q, a in tool["faq"]
    )
    related_html = "\n".join(
        '        <a href="{url}">{name} &rarr;</a>'.format(
            url=clean_url(TOOLS_BY_SLUG[s]["slug"]), name=TOOLS_BY_SLUG[s]["name"]
        )
        for s in tool["related"]
    )

    body = """<body data-tool="{slug}">
{header}
  <main>
    <section class="panel">
      <div class="wrap">
        <div class="panel-head">
          <h1 tabindex="-1">{name}</h1>
          <a class="back-to-tools" href="/" data-panel-link="">&larr; All tools</a>
        </div>
        <p>{intro}</p>
        <div class="workspace">
{workspace}        </div>
      </div>
    </section>

    <section class="content-section" id="how-it-works">
      <div class="wrap">
        <h2>How to use the {name}</h2>
        <div class="how-to">
          <ol>
{how_to}
          </ol>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="wrap">
        <h2>FAQ</h2>
        <dl class="faq">
{faq}
        </dl>
      </div>
    </section>

    <section class="content-section">
      <div class="wrap">
        <h2>Related tools</h2>
        <div class="related-links">
{related}
        </div>
      </div>
    </section>
  </main>
{footer}
  <script type="application/ld+json">{faq_ld}</script>
{scripts}
</body>""".format(
        slug=tool["slug"],
        header=header(tool["slug"]),
        name=tool["name"],
        intro=tool["intro"],
        workspace=tool["workspace"],
        how_to=how_to_html,
        faq=faq_html,
        related=related_html,
        footer=footer(),
        faq_ld=faq_ld,
        scripts=scripts_tail(),
    )

    html = "<!doctype html>\n<html lang=\"en\">\n" + head(
        title, tool["description"], canonical_path, json_ld
    ) + "\n" + body + "\n</html>\n"
    write_clean(tool["slug"], html)


for t in TOOLS:
    tool_page(t)

# -------------------------------------------------------------- homepage --

def homepage():
    title = "drawlots.net — Free Random Decision Tools: Wheel, Dice, Brackets & More"
    description = "Nine free instant chance tools in one place: spinner wheel, random name picker, dice roller, coin flip, random number generator, team generator, tournament bracket, Secret Santa and rota builder. Cryptographically random, 100% client-side."
    json_ld = (
        '{{"@context":"https://schema.org","@type":"WebSite","name":"drawlots.net","url":{url},'
        '"description":{desc}}}'
    ).format(url=jstr(SITE + "/"), desc=jstr(description))

    cards = []
    for t in TOOLS:
        cards.append(
            """          <a class="tool-card" href="{url}" data-panel-link="{slug}" style="--card-accent: var(--lot-{color})">
            <span class="chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{icon}</svg></span>
            <h3>{name}</h3>
            <p>{tagline}</p>
          </a>""".format(
                url=clean_url(t["slug"]), slug=t["slug"], icon=t["icon"], name=t["name"], tagline=t["tagline"],
                color=CARD_COLOR[t["slug"]],
            )
        )
    cards_html = "\n".join(cards)

    panels = []
    for t in TOOLS:
        panels.append(
            """    <section class="panel" data-panel="{slug}" data-title="{name} &mdash; drawlots.net" hidden>
      <div class="wrap">
        <div class="panel-head">
          <h2 tabindex="-1">{name}</h2>
          <a class="back-to-tools" href="/" data-panel-link="">&larr; All tools</a>
        </div>
        <p>{intro}</p>
        <div class="workspace">
{workspace}        </div>
        <p style="margin-top:16px;font-size:14px"><a href="{url}#how-it-works">Full guide &amp; FAQ for the {name} &rarr;</a></p>
      </div>
    </section>""".format(
                slug=t["slug"], name=t["name"], intro=t["intro"], workspace=t["workspace"],
                url=clean_url(t["slug"]),
            )
        )
    panels_html = "\n".join(panels)

    body = """<body>
{header}
  <main>
    <section class="hero">
      <div class="wrap">
        <div>
          <p class="eyebrow">nine ways to leave it to chance</p>
          <h1>Can't decide?<br>Draw a lot.</h1>
          <p class="lede">A spinner wheel, a name picker, dice, a coin, a number generator, a team splitter, a tournament bracket, a Secret Santa draw and a rota builder &mdash; every one of them decided by real cryptographic randomness, right here in your browser. Nothing you type ever leaves this tab.</p>
        </div>
{lots}
      </div>
    </section>

    <section class="panel" id="overview-panel">
      <div class="wrap">
        <h2 class="visually-hidden">All tools</h2>
        <div class="tool-grid">
{cards}
        </div>
      </div>
    </section>

{panels}

    <section class="content-section">
      <div class="wrap">
        <h2>Why crypto.getRandomValues, not Math.random()?</h2>
        <p>Every draw on this site &mdash; the wheel's winner, a dice face, a coin's side &mdash; is chosen with <code>crypto.getRandomValues</code>, the same cryptographically strong randomness source browsers use for security-sensitive code. <code>Math.random()</code> is a faster, weaker generator never designed to resist prediction. It isn't used anywhere on drawlots.net.</p>
        <p><a href="/articles/">Read more in the articles &rarr;</a></p>
      </div>
    </section>
  </main>
{footer}
{scripts}
</body>""".format(
        header=header(None),
        lots=HERO_LOTS_SVG,
        cards=cards_html,
        panels=panels_html,
        footer=footer(),
        scripts=scripts_tail(),
    )

    html = "<!doctype html>\n<html lang=\"en\">\n" + head(title, description, "/", json_ld) + "\n" + body + "\n</html>\n"
    write("index.html", html)


CARD_COLOR = {
    "spinner-wheel": "coral",
    "random-name-picker": "violet",
    "dice-roller": "amber",
    "coin-flip": "gold",
    "random-number-generator": "sky",
    "team-generator": "mint",
    "tournament-bracket": "cobalt",
    "secret-santa": "berry",
    "rota-builder": "teal",
}

homepage()

# ------------------------------------------------------------ legal pages --

def legal_page(slug, title_text, body_html):
    canonical_path = clean_url(slug)
    title = "{t} | drawlots.net".format(t=title_text)
    description = "{t} for drawlots.net, a set of free, browser-only random decision tools.".format(t=title_text)
    json_ld = '{{"@context":"https://schema.org","@type":"WebPage","name":{name},"url":{url}}}'.format(
        name=jstr(title), url=jstr(SITE + canonical_path)
    )
    body = """<body>
{header}
  <main>
    <section class="doc-page">
      <div class="wrap">
{content}
      </div>
    </section>
  </main>
{footer}
{scripts}
</body>""".format(header=header("other"), content=body_html, footer=footer(), scripts=scripts_tail())
    html = "<!doctype html>\n<html lang=\"en\">\n" + head(title, description, canonical_path, json_ld) + "\n" + body + "\n</html>\n"
    write_clean(slug, html)


PRIVACY_BODY = """        <h1>Privacy</h1>
        <p>drawlots.net is a set of chance-based tools that run entirely in your browser. This page explains, plainly, what that means for your data.</p>

        <h2>What we don't collect</h2>
        <p>drawlots.net has no server-side application, no account system, and no analytics beacons. The entries you type into the wheel, the names you list, the ranges you set &mdash; all of it is processed by JavaScript already running in your tab. None of it is sent to us, because there's no endpoint for it to go to.</p>

        <h2>Shareable links</h2>
        <p>Some tools let you build a "Copy link" URL that encodes your list or settings directly in the address, so you can send it to someone else. That data lives in the link itself &mdash; it is never stored on any server of ours. Only share a link if you're comfortable with whoever receives it seeing what's in it.</p>

        <h2>Local storage</h2>
        <p>drawlots.net saves one small preference in your browser's local storage: your light/dark theme choice. It stays on your device and is never transmitted anywhere. You can clear it at any time by clearing this site's data in your browser settings.</p>

        <h2>Advertising</h2>
        <p>This site shows ads served by Google AdSense, which may use cookies to personalize ads based on your visits to this and other sites. You can control ad personalization through <a href="https://adssettings.google.com" rel="noopener">Google's Ad Settings</a>, and learn more about how Google uses data at <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>

        <h2>Contact</h2>
        <p>Questions about this policy can be raised via the <a href="https://erabb.it" rel="noopener">erabb.it</a> portfolio site linked in the corner of every page here.</p>"""

TERMS_BODY = """        <h1>Terms</h1>
        <p>drawlots.net's tools are provided free, as-is, for anyone to use.</p>

        <h2>No warranty</h2>
        <p>These tools are provided without warranty of any kind. The randomness behind every draw is implemented carefully using your browser's cryptographic random number generator, but you're responsible for deciding whether that's suitable for whatever you're using it to settle &mdash; from a lunch order to a raffle with real prizes.</p>

        <h2>Acceptable use</h2>
        <p>Use drawlots.net for its intended purpose &mdash; making a random choice. Don't attempt to disrupt the site, scrape it abusively, or use it in a way that violates applicable law, including for gambling where prohibited.</p>

        <h2>Your content stays yours</h2>
        <p>Any list of names, entries or numbers you type into these tools is yours. drawlots.net doesn't claim any rights to it, and as explained in the <a href="/privacy/">privacy page</a>, it never leaves your browser unless you deliberately share a link containing it.</p>

        <h2>Changes</h2>
        <p>These terms may be updated occasionally as the site evolves. Continued use after a change means you accept the current version.</p>"""

legal_page("privacy", "Privacy", PRIVACY_BODY)
legal_page("terms", "Terms", TERMS_BODY)

# ---------------------------------------------------------------- 404 --

def not_found_page():
    title = "Page not found | drawlots.net"
    description = "This page doesn't exist. Find a chance tool from the drawlots.net homepage."
    json_ld = '{{"@context":"https://schema.org","@type":"WebPage","name":{name},"url":{url}}}'.format(
        name=jstr(title), url=jstr(SITE + "/404.html")
    )
    body = """<body>
{header}
  <main>
    <section class="doc-page">
      <div class="wrap">
        <h1>404 &mdash; nothing here</h1>
        <p>That page doesn't exist. Every tool lives at a clean address off the homepage.</p>
        <p><a href="/">Back to drawlots.net &rarr;</a></p>
      </div>
    </section>
  </main>
{footer}
  <script src="/assets/app.js"></script>
</body>""".format(header=header("other"), footer=footer())
    html = "<!doctype html>\n<html lang=\"en\">\n" + head(title, description, "/404.html", json_ld, include_ads=False) + "\n" + body + "\n</html>\n"
    write("404.html", html)


not_found_page()

# ------------------------------------------------------------- articles --

ARTICLES = [
    dict(
        slug="the-surprisingly-long-history-of-drawing-lots",
        title="The Surprisingly Long History of Drawing Lots",
        description="Long before dice or coins, people were deciding by chance with sticks, stones, and straws. A short history of drawing lots and why it endures.",
        published="2026-07-18",
        body="""        <p>"Drawing lots" is one of the oldest known ways humans have made decisions by chance &mdash; older than the coin, and probably older than the die. The phrase itself comes from the practice of using unmarked sticks, straws, stones, or pieces of pottery ("lots") that are drawn from a container without looking, so no one can influence the outcome.</p>

        <h2>An ancient, almost universal idea</h2>
        <p>Casting or drawing lots shows up independently across an enormous range of cultures and eras &mdash; in the Hebrew Bible, where lots were used to divide land and choose leaders; in ancient Greece, where sortition (selection by lot) was used to fill many public offices, on the theory that it prevented factions from buying or campaigning for a post; and in Rome, where soldiers drew lots to decide who would face a punishment or an honor. The underlying idea is the same everywhere it appears: when a decision needs to be made and no one wants to be accused of bias, hand the decision to chance instead of to a person.</p>

        <h2>Why chance felt fair &mdash; and still does</h2>
        <p>A decision made by a person can always be second-guessed: was it favoritism, a grudge, a bribe? A decision made by chance sidesteps that question entirely. Nobody can be blamed for how a stick falls or a stone tumbles out of a bag. That's precisely why lots were historically used for jobs nobody wanted to be seen fighting over &mdash; not just splitting an inheritance, but who guards the camp overnight, or who among equals gets the tie-breaking vote.</p>

        <h2>From straws to software</h2>
        <p>Modern versions of the same idea are everywhere: drawing straws (literally, a short one marks the "loser"), flipping a coin, rolling dice, or picking a name from a hat. drawlots.net is a digital descendant of exactly that instinct &mdash; the tools here don't decide anything themselves, any more than a bag of stones does. They just make it easy to hand a decision to genuine chance, drawn with your browser's cryptographic random number generator instead of a handful of sticks, whenever a coin isn't in your pocket and a hat isn't on hand.</p>

        <h2>What hasn't changed</h2>
        <p>The one requirement that has never changed, from ancient sortition to a spinner wheel on a phone, is that the draw has to actually be random and unpredictable in advance &mdash; otherwise it's just a decision in disguise. That's the whole reason this site is built on <code>crypto.getRandomValues</code> rather than a weaker, more predictable random function: the oldest rule of drawing lots is still the only one that matters.</p>""",
    ),
    dict(
        slug="how-random-is-crypto-getrandomvalues-really",
        title="How Random Is crypto.getRandomValues, Really?",
        description="Why drawlots.net uses crypto.getRandomValues instead of Math.random(), what rejection sampling is, and why it matters even for something as low-stakes as a spinner wheel.",
        published="2026-07-18",
        body="""        <p>Every tool on this site &mdash; the wheel, the dice, the coin, the number generator &mdash; ultimately calls one browser function: <code>crypto.getRandomValues</code>. It's worth explaining why, because most random-looking code on the web actually reaches for something weaker: <code>Math.random()</code>.</p>

        <h2>Two very different kinds of "random"</h2>
        <p><code>Math.random()</code> is a pseudorandom number generator optimized for speed, not unpredictability. Depending on the browser, its internal state can, in principle, be reconstructed from a sequence of outputs &mdash; which is irrelevant for something like a particle animation, but matters if randomness needs to resist someone trying to predict or influence it. <code>crypto.getRandomValues</code>, part of the Web Crypto API, is built on the operating system's cryptographically secure random number generator &mdash; the same class of randomness used to generate encryption keys. It's slower, and total overkill for some use cases, but it comes with a real guarantee behind it.</p>

        <h2>Does it matter for a spinner wheel?</h2>
        <p>Honestly, probably not, for most uses. Nobody is going to break into a "what's for dinner" wheel via a randomness side-channel. But once you're drawing names for a raffle with a real prize, splitting people into teams for something competitive, or settling a dispute where someone might genuinely want to influence the outcome, using the stronger source costs nothing and removes any question about whether the result could have been predicted or nudged. drawlots.net uses it everywhere, for everything, rather than deciding case-by-case where it "really" matters.</p>

        <h2>What rejection sampling fixes</h2>
        <p>There's a second, subtler problem: even with a good random source, converting a random 32-bit number into "an integer between 1 and 37" naively (with a modulo operation) introduces a small bias toward the lower numbers in the range, because 2^32 doesn't divide evenly by 37. This site's random helper avoids that by rejection sampling: it draws a fresh random 32-bit value and simply discards (rejects) any value that would fall in the leftover, unevenly-distributed remainder, trying again until it gets one that maps cleanly. The result is a genuinely uniform choice across your exact range, not an approximately uniform one.</p>

        <h2>The short version</h2>
        <p>Strong randomness source, unbiased mapping onto your range, nothing sent anywhere. That's the entire technical story behind every wheel spin, dice roll, and coin flip on this site.</p>""",
    ),
    dict(
        slug="fair-ways-to-split-a-group-into-teams",
        title="Fair Ways to Split a Group Into Teams",
        description="Picking captains, going by height, counting off &mdash; every classic way to split a group into teams has a fairness problem. Here's what actually works.",
        published="2026-07-18",
        body="""        <p>Splitting a group into teams sounds simple until you're the one doing it in front of the group. Almost every classic method has a built-in fairness problem that people notice, even when nobody says anything.</p>

        <h2>The captain problem</h2>
        <p>Picking two captains and letting them choose players one at a time is the most common method &mdash; and the most visibly unfair one. Whoever gets picked last knows exactly why, every time. It also quietly rewards whatever the captains happen to value (height, speed, popularity), which may have nothing to do with what actually makes teams competitive for the game you're about to play.</p>

        <h2>Counting off</h2>
        <p>Going around a circle counting "one, two, one, two" is faster and avoids the visible ranking problem, but it isn't random either &mdash; it's determined entirely by where people happened to be standing. If the tallest three people in the room happened to cluster together while lining up, "one, two, one, two" can hand one team a real advantage without anyone intending it.</p>

        <h2>What a random shuffle actually fixes</h2>
        <p>A true random split &mdash; take the whole list, shuffle it with a fair, unbiased shuffle, then deal names to teams in order &mdash; removes both problems at once. Nobody is picked last for a reason anyone can point to, and the result doesn't depend on where anyone happened to be standing or how the captains felt that day. The <a href="/team-generator/">team generator</a> on this site does exactly this: a cryptographically random Fisher-Yates shuffle, then a simple round-robin deal so team sizes never differ by more than one person.</p>

        <h2>When random isn't actually what you want</h2>
        <p>To be fair to the alternatives: sometimes you do want skill-balanced teams, not random ones &mdash; a serious league draft, for instance, cares about competitive balance more than about looking unbiased. Random splitting is the right tool specifically when the goal is removing any appearance of favoritism for a casual game, a classroom activity, or a one-off event, not when you're optimizing for a close final score.</p>

        <h2>The simplest fix for the most common complaint</h2>
        <p>The single biggest complaint about team-picking isn't usually about the outcome &mdash; it's about the process feeling personal. A random split can't be personal. That alone is usually worth more than getting the "perfect" balance of skill.</p>""",
    ),
    dict(
        slug="coin-flips-dice-rolls-and-the-myth-of-streaks",
        title="Coin Flips, Dice Rolls, and the Myth of Streaks",
        description="Five heads in a row doesn't make tails 'due.' A plain explanation of the gambler's fallacy and why every flip, roll, and spin here is completely independent of the last.",
        published="2026-07-18",
        body="""        <p>If a coin lands heads five times in a row, plenty of people feel like tails is "due." It isn't &mdash; and understanding why is one of the more useful pieces of intuition you can build about chance.</p>

        <h2>The gambler's fallacy</h2>
        <p>The belief that a streak makes the opposite outcome more likely soon is called the gambler's fallacy, and it's one of the most common misunderstandings of probability. A fair coin has no memory. It doesn't know it landed heads the last five times, and it isn't "keeping score." Every single flip is an independent event with exactly the same 50/50 odds as the first flip ever made, regardless of what came before it.</p>

        <h2>Why streaks feel meaningful anyway</h2>
        <p>Human pattern-recognition is very good at spotting streaks and very bad at estimating how common they actually are by pure chance. Flip a coin 20 times and a run of four or five of the same result in a row is not unusual at all &mdash; it's exactly what you'd expect from genuine randomness over that many flips. A truly random sequence looks streakier than most people's intuition of "random" looks, which is part of why real random data can feel suspicious even when it's working correctly.</p>

        <h2>The same logic applies to dice and the wheel</h2>
        <p>Rolling the same number twice in a row on a die, or landing on the same wheel segment twice back to back, feels like it "shouldn't" happen &mdash; but each roll or spin is independent in exactly the same way a coin flip is. The die doesn't know what it rolled last time, and the wheel doesn't remember its last winner. If anything, a tool that avoided repeating a recent result would be less random, not more &mdash; it would mean the outcome wasn't a truly free draw.</p>

        <h2>What actually would be suspicious</h2>
        <p>The real red flag for broken randomness isn't a streak &mdash; it's a result that's suspiciously even over the long run in a way pure chance rarely produces, or a result that correlates with something it shouldn't (like always favoring the first item in a list). Every draw on this site is independent and identically distributed: no memory, no pattern, no favorite. Streaks are allowed, because that's what genuine randomness actually looks like.</p>""",
    ),
]


def article_page(article):
    slug = "articles/" + article["slug"]
    canonical_path = "/" + slug + "/"
    title = "{t} | drawlots.net".format(t=article["title"])
    json_ld = (
        '{{"@context":"https://schema.org","@type":"Article","headline":{h},"description":{d},'
        '"datePublished":{p},"url":{u},"author":{{"@type":"Organization","name":"drawlots.net"}}}}'
    ).format(h=jstr(article["title"]), d=jstr(article["description"]), p=jstr(article["published"]), u=jstr(SITE + canonical_path))

    body = """<body>
{header}
  <main>
    <section class="article-page">
      <div class="wrap">
        <h1>{title}</h1>
        <p class="article-meta">Published {published}</p>
{content}
        <p style="margin-top:30px"><a href="/articles/">&larr; All articles</a></p>
      </div>
    </section>
  </main>
{footer}
{scripts}
</body>""".format(
        header=header("other"), title=article["title"], published=article["published"],
        content=article["body"], footer=footer(), scripts=scripts_tail(),
    )
    html = "<!doctype html>\n<html lang=\"en\">\n" + head(title, article["description"], canonical_path, json_ld) + "\n" + body + "\n</html>\n"
    write(slug + "/index.html", html)
    write(slug + ".html", html)


def article_hub():
    canonical_path = "/articles/"
    title = "Articles | drawlots.net"
    description = "Reading on randomness, fairness and the history of deciding by chance, from the team behind drawlots.net's spinner wheel, dice, coin and other tools."
    json_ld = '{{"@context":"https://schema.org","@type":"CollectionPage","name":{name},"url":{url}}}'.format(
        name=jstr(title), url=jstr(SITE + canonical_path)
    )
    items = []
    for a in ARTICLES:
        items.append(
            """        <li><a href="/articles/{slug}/"><h3>{title}</h3><p>{description}</p></a></li>""".format(
                slug=a["slug"], title=a["title"], description=a["description"]
            )
        )
    body = """<body>
{header}
  <main>
    <section class="article-hub">
      <div class="wrap">
        <h1>Articles</h1>
        <p>Short reads on randomness, fairness, and the long history of deciding things by chance.</p>
        <ul class="article-list">
{items}
        </ul>
      </div>
    </section>
  </main>
{footer}
{scripts}
</body>""".format(header=header("other"), items="\n".join(items), footer=footer(), scripts=scripts_tail())
    html = "<!doctype html>\n<html lang=\"en\">\n" + head(title, description, canonical_path, json_ld) + "\n" + body + "\n</html>\n"
    write("articles/index.html", html)


for a in ARTICLES:
    article_page(a)
article_hub()

# --------------------------------------------------------- root files --

write("CNAME", "drawlots.net\n")
write("ads.txt", "google.com, pub-7560786263587509, DIRECT, f08c47fec0942fa0\n")
write(".nojekyll", "")
write(
    "robots.txt",
    "User-agent: *\nAllow: /\nSitemap: {}/sitemap.xml\n".format(SITE),
)

sitemap_urls = (
    ["/"]
    + [clean_url(t["slug"]) for t in TOOLS]
    + [clean_url("privacy"), clean_url("terms"), "/articles/"]
    + ["/articles/" + a["slug"] + "/" for a in ARTICLES]
)
sitemap_entries = "\n".join(
    "  <url><loc>{}{}</loc><lastmod>{}</lastmod></url>".format(SITE, u, TODAY)
    for u in sitemap_urls
)
sitemap = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + sitemap_entries
    + "\n</urlset>\n"
)
write("sitemap.xml", sitemap)

print("Generated {} tool pages, homepage, legal, 404, {} articles + meta files.".format(len(TOOLS), len(ARTICLES)))
