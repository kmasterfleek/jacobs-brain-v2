// Guided tour over the live Observatory: a spotlight dims everything but one spot, a card
// explains it, and "do it" steps advance when the viewer actually does the thing.
// Starts on first visit (per browser); "? Tour" in the header replays it; #tour forces it.
(() => {
  const LS = "dodo-observatory-tour-v1";
  const EXAMPLE = "teachers leaving the profession";

  const css = document.createElement("style");
  css.textContent = `
  #tour-hole { position: fixed; z-index: 40; pointer-events: none; border-radius: 14px;
    box-shadow: 0 0 0 9999px rgba(6,8,7,.72); border: 1.5px solid rgba(217,164,65,.9);
    transition: all .35s ease; }
  #tour-card { position: fixed; z-index: 41; width: 330px; max-width: calc(100vw - 32px);
    background: #1a1f1b; border: 1px solid rgba(255,255,255,.14); border-radius: 14px;
    padding: 16px 18px 14px; box-shadow: 0 18px 50px rgba(0,0,0,.6); color: var(--ink);
    transition: top .35s ease, left .35s ease; }
  #tour-card .step { font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--warn); font-weight: 700; }
  #tour-card h3 { font-size: 17px; margin: 4px 0 6px; text-wrap: balance; }
  #tour-card p { font-size: 13.5px; line-height: 1.55; color: var(--ink-2); }
  #tour-card p + p { margin-top: 8px; }
  #tour-card .do { margin-top: 10px; font-size: 13px; color: var(--accent); font-weight: 600; }
  #tour-card .do.done { color: var(--muted); text-decoration: line-through; }
  #tour-card .row { display: flex; gap: 8px; margin-top: 14px; align-items: center; }
  #tour-card .row .sp { flex: 1; }
  #tour-card button { font: 600 13px system-ui; padding: 7px 14px; border-radius: 999px; cursor: pointer;
    border: 1px solid rgba(255,255,255,.18); background: transparent; color: var(--ink-2); }
  #tour-card button.primary { background: var(--warn); border-color: var(--warn); color: #1c1408; }
  #tour-card button.go { background: var(--accent); border-color: var(--accent); color: #0c1611; }
  #tour-card button:disabled { opacity: .35; cursor: default; }
  #tour-card button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  #tour-card .skip { background: none; border: none; color: var(--muted); padding: 7px 4px; font-weight: 400; }
  #tourbtn { padding: 9px 14px; border-radius: 999px; border: 1px solid var(--hairline); background: transparent;
    color: var(--ink-2); font: 600 13px system-ui; cursor: pointer; white-space: nowrap; }
  #tourbtn:hover { color: var(--ink); border-color: rgba(255,255,255,.3); }
  @media (prefers-reduced-motion: reduce) { #tour-hole, #tour-card { transition: none; } }`;
  document.head.appendChild(css);

  // ---- targets: DOM elements or live canvas positions ----
  const el = (sel) => () => { const e = document.querySelector(sel); if (!e || !e.offsetParent && getComputedStyle(e).position !== "fixed") return null; const r = e.getBoundingClientRect(); return r.width ? r : null; };
  const pad = (r, p) => r && ({ left: r.left - p, top: r.top - p, width: r.width + 2 * p, height: r.height + 2 * p });
  const topStar = () => [...PEOPLE].sort((a, b) => b.n - a.n)[0];
  const starRect = () => { const [x, y] = toScreen(topStar().x, topStar().y); return { left: x - 26, top: y - 26, width: 150, height: 52 }; };
  const topicBox = () => regionBoxes[0] || null;
  const topicRect = () => { const b = topicBox(); return b && pad({ left: b.x, top: b.y, width: b.w, height: b.h }, 10); };
  const dustRect = () => ({ left: CX - R * 0.55, top: CY - R * 0.95, width: R * 1.1, height: R * 0.75 });
  let tourMtg = -1;
  const pickMeeting = () => {
    const today = MEETINGS.findIndex(m => m.day === calDay && mppl(m).length);
    return today >= 0 ? today : MEETINGS.findIndex(m => mppl(m).length);
  };

  const steps = [
    { title: "Your network, from the outside",
      body: ["This is 13 years of what you've written on LinkedIn — every comment, split into sentences and placed on a map by <b>meaning</b>.",
             "Nothing here is typed in by hand. It's your own words, organized so you can see who you talk to about what."],
      target: () => ({ left: 16, top: 110, width: innerWidth - 32, height: innerHeight - 230 }) },
    { title: "Stars are people",
      body: ["Each star is someone you talk to. Bigger = more often. People you talk to about <b>similar things</b> sit near each other — the position is about topics, not geography or importance."],
      doText: "Click this star to open their card", target: starRect,
      enter: () => { closePanel(); },
      done: () => selected && selected.i === topStar().i },
    { title: "Their card",
      body: ["Every time you mentioned them, year by year — plus what's in your files and the actual things you said to them, newest first, with links back to LinkedIn."],
      target: el("#panel") },
    { title: "Dust is everything you wrote",
      body: ["Each tiny dot is one thing you said. Hover any dot to read it. Click one and you'll get <b>✦ More like this</b> — everything else you've said that means something similar."],
      target: dustRect, enter: () => closePanel() },
    { title: "Topics you keep coming back to",
      body: ["The violet captions are subjects you return to again and again, found automatically from your words."],
      doText: "Click this topic", target: topicRect,
      enter: () => { setView("topics", true); },
      done: () => results && panel.classList.contains("show") && /^Topic:/.test(panel.querySelector("h2")?.textContent || "") },
    { title: "Who a topic belongs to",
      body: ["Green dots are everything you've said on that topic. The list ranks <b>who you say it to</b>. A topic with almost nobody on this list is one you talk about a lot — but no one owns yet. That's an opening."],
      target: el("#panel") },
    { title: "Too busy? Turn things off",
      body: ["Topics, names, and the key can each be switched on and off — or press T, N, K."],
      doText: "Click “Names” to hide them, then again to bring them back", target: () => pad(el("#viewbar")(), 6),
      enter: () => { clearSearch(); this_names = VIEW.names; flips = 0; },
      done: () => flips >= 1 },
    { title: "This week's calendar",
      body: ["Your meetings live right inside the map."],
      doText: "Click “This week's calendar”", target: () => pad(el("#calbtn")(), 6),
      done: () => calOpen },
    { title: "Click a meeting",
      body: ["Anyone in it who's on your map lights up <b>amber</b>, along with everything you've ever said to them. The purple note is the intern's prep; orange flags are warnings, like asking the same person twice in one week."],
      doText: "Click this meeting", target: () => { const e = document.querySelector(`.mtg[data-i="${tourMtg}"]`); return e ? pad(e.getBoundingClientRect(), 4) : null; },
      enter: () => { tourMtg = pickMeeting(); if (tourMtg >= 0 && MEETINGS[tourMtg].day !== calDay) { calDay = MEETINGS[tourMtg].day; renderCal(); } setTimeout(() => document.querySelector(`.mtg[data-i="${tourMtg}"]`)?.scrollIntoView({ block: "center" }), 50); },
      done: () => openMtg === tourMtg },
    { title: "Missing someone?",
      body: ["If a name was misspelled on the invite or never made it on, type it here — it finds people even with typos. They'll light up with the meeting from then on."],
      target: () => { const e = document.querySelector(`.mtg[data-i="${tourMtg}"] .addwho`); return e ? pad(e.getBoundingClientRect(), 6) : null; } },
    { title: "Search by meaning, not words",
      body: [`Ask about anything. It finds what you meant even when you used different words. Try this one: <b>“${EXAMPLE}.”</b>`],
      target: () => pad(el("#searchbox")(), 6),
      enter: () => { toggleCal(false); closePanel(); },
      action: { label: "Run this search", run: () => { $("#q").value = EXAMPLE; doSearch(); } },
      done: () => results && $("#q").value === EXAMPLE },
    { title: "What comes back",
      body: ["Everything you've said about it lights up green, with lines to who you said it to. The panel ranks the people this topic belongs to, and the bars at the bottom show <b>when</b> you talked about it.",
             "Clear the search anytime and ask your own question."],
      target: () => ({ left: 16, top: 96, width: innerWidth - 32, height: innerHeight - 110 }) },
    { title: "That's it",
      body: ["Click around — nothing you do here changes your data. You can replay this tour anytime with <b>? Tour</b> at the top."],
      target: () => pad(el("#tourbtn")(), 6), last: true },
  ];

  // ---- runtime ----
  let i = -1, hole, card, flips = 0, this_names = true, raf;
  const origSetView = setView;
  setView = (k, v) => { origSetView(k, v); if (k === "names") flips++; };
  window.setView = setView;

  function place() {
    if (i < 0) return;
    const s = steps[i], r = s.target() || { left: innerWidth / 2 - 40, top: innerHeight / 2 - 40, width: 80, height: 80 };
    Object.assign(hole.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
    const cw = card.offsetWidth, ch = card.offsetHeight, m = 16;
    let left = r.left + r.width + m, top = r.top;
    if (left + cw > innerWidth - m) left = r.left - cw - m;
    if (left < m) { left = Math.min(Math.max(m, r.left), innerWidth - cw - m); top = r.top + r.height + m; }
    if (top + ch > innerHeight - m) top = Math.max(m, r.top - ch - m);
    if (top < m) top = m;
    if (r.height > innerHeight * 0.6 && r.width > innerWidth * 0.6) { left = innerWidth - cw - 28; top = innerHeight - ch - 120; }
    card.style.left = left + "px"; card.style.top = top + "px";
    const s2 = steps[i];
    if (s2.done) {
      const ok = !!s2.done();
      card.querySelector(".do")?.classList.toggle("done", ok);
      const nx = card.querySelector(".next"); if (nx) nx.disabled = !ok;
      if (ok && !s2._advanced) { s2._advanced = true; setTimeout(() => { if (steps[i] === s2) go(i + 1); }, 900); }
    }
    raf = requestAnimationFrame(place);
  }
  function go(n) {
    if (n >= steps.length) return end(true);
    i = Math.max(0, n);
    const s = steps[i];
    s._advanced = false;
    if (s.enter) s.enter();
    card.innerHTML = `<div class="step">Step ${i + 1} of ${steps.length}</div>
      <h3>${s.title}</h3>${s.body.map(b => `<p>${b}</p>`).join("")}
      ${s.doText ? `<div class="do">→ ${s.doText}</div>` : ""}
      <div class="row">
        ${i > 0 ? `<button class="back">Back</button>` : ""}
        <span class="sp"></span>
        ${s.last ? "" : `<button class="skip">Skip tour</button>`}
        ${s.action ? `<button class="go">${s.action.label}</button>` : ""}
        <button class="next primary" ${s.done ? "disabled" : ""} ${s.action ? 'hidden' : ""}>${s.last ? "Start exploring" : "Next"}</button>
      </div>`;
    card.querySelector(".back")?.addEventListener("click", () => go(i - 1));
    card.querySelector(".skip")?.addEventListener("click", () => end(true));
    card.querySelector(".go")?.addEventListener("click", () => s.action.run());
    card.querySelector(".next").addEventListener("click", () => go(i + 1));
    card.querySelector(".next").focus({ preventScroll: true });
  }
  function start() {
    end(false);
    clearSearch(); toggleCal(false); closePanel();
    T.k = 1; T.tx = 0; T.ty = 0; renderDustLayer();
    origSetView("topics", true); origSetView("names", true);
    hole = document.createElement("div"); hole.id = "tour-hole";
    card = document.createElement("div"); card.id = "tour-card"; card.setAttribute("role", "dialog"); card.setAttribute("aria-live", "polite");
    document.body.append(hole, card);
    go(0); place();
  }
  function end(seen) {
    cancelAnimationFrame(raf);
    hole?.remove(); card?.remove(); hole = card = null; i = -1;
    if (seen) try { localStorage.setItem(LS, "1"); } catch {}
  }
  window.addEventListener("keydown", (e) => { if (i >= 0 && e.key === "Escape") end(true); });

  const btn = document.createElement("button");
  btn.id = "tourbtn"; btn.textContent = "? Tour"; btn.title = "Replay the guided tour";
  btn.onclick = start;
  document.querySelector("header").appendChild(btn);

  let seen = false; try { seen = !!localStorage.getItem(LS); } catch {}
  const at = location.hash.match(/(?:^#|&)tour(?:=(\d+))?/);
  if (at || (!seen && !location.hash)) setTimeout(() => { start(); if (at && at[1]) go(+at[1] - 1); }, 700);
})();
