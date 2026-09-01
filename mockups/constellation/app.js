// UI wiring: company selection, contact panel, morning briefing, the Dojo, voice pass.

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

const viz = new Constellation($("#sky"), CONTACTS, UNRATED);
let currentCompany = null;
let currentMatches = null;

// ---------- company chips ----------
const chipRow = $("#companies");
for (const co of COMPANIES) {
  const chip = el("button", "chip", `<span class="dot" style="background:${co.hue}"></span>${co.name}<span class="heat heat-${co.heat}">${co.heat} · day ${co.day}</span>`);
  chip.onclick = () => selectCompany(currentCompany?.id === co.id ? null : co);
  chip.dataset.id = co.id;
  chipRow.appendChild(chip);
}

function selectCompany(co) {
  currentCompany = co;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", !!co && c.dataset.id === co.id));
  if (!co) { currentMatches = null; viz.setCompany(null, null, []); $("#briefing").classList.remove("show"); renderPanel(viz.nodeById[viz.selected]); return; }
  currentMatches = new Map(CONTACTS.map((c) => [c.id, matchContact(c, co)]));
  const ranked = [...currentMatches.entries()]
    .filter(([id, m]) => !viz.nodeById[id]?.flags?.paid)
    .sort((a, b) => b[1].score - a[1].score);
  const top3 = ranked.slice(0, 3).map(([id]) => id);
  viz.setCompany(currentMatches, co.hue, top3);
  renderBriefing(co, ranked, top3);
  renderPanel(viz.nodeById[viz.selected]);
}

// ---------- morning briefing ----------
function renderBriefing(co, ranked, top3) {
  const b = $("#briefing");
  b.innerHTML = `<div class="b-head" style="border-color:${co.hue}"><strong>${co.name}</strong> — this morning's three moves</div>`;
  top3.forEach((id, i) => {
    const c = viz.nodeById[id], m = currentMatches.get(id);
    const why = [
      m.relevance >= 0.5 ? "pain match" : m.relevance > 0 ? "partial pain match" : "reach play",
      m.openerFit === 1 ? "opener fits" : null,
      c.openness >= 2 ? "can open doors" : null,
      (c.flags?.paid ? false : c.capacity) >= 0.8 ? "fully charged" : null,
    ].filter(Boolean).join(" · ");
    const row = el("div", "b-row",
      `<span class="b-num" style="background:${co.hue}">${i + 1}</span>
       <span class="b-name">${c.name}</span><span class="b-why">${why} — “${m.angle.name}”</span>`);
    row.onclick = () => { viz.selected = id; renderPanel(c); };
    b.appendChild(row);
  });
  // the inverse view: best asset going unused
  const unused = ranked.filter(([id, m]) => { const c = viz.nodeById[id]; return c.openness >= 2 && c.capacity >= 0.9 && !top3.includes(id); })[0];
  if (unused) {
    const c = viz.nodeById[unused[0]];
    b.appendChild(el("div", "b-unused", `◇ Going unused: <strong>${c.name}</strong> — opener at full capacity, no active asks anywhere.`));
  }
  b.classList.add("show");
}

// ---------- tooltip ----------
const tip = $("#tip");
viz.onHover = (n, e) => {
  if (!n) { tip.style.display = "none"; return; }
  tip.style.display = "block";
  tip.style.left = Math.min(e.clientX + 16, innerWidth - 240) + "px";
  tip.style.top = e.clientY + 12 + "px";
  if (!n.rated) {
    tip.innerHTML = `<strong>${n.name}</strong><br><span class="muted">${[n.role, n.org].filter((x) => x && x !== "—").join(" · ")}</span>
      <div class="tip-unknown">unrated — no voice pass yet. Unknown, not low-value.</div>`;
    return;
  }
  const cap = n.flags?.paid ? null : n.capacity;
  tip.innerHTML = `<strong>${n.name}</strong><br><span class="muted">${n.role} · ${n.org}</span>
    ${cap !== null ? `<div class="cap-row"><span class="cap-bar"><span style="width:${cap * 100}%;background:${cap < 0.35 ? "#fab219" : "#fff"}"></span></span><span class="muted">${Math.round(cap * 100)}% capacity</span></div>` : `<div class="tip-paid">▣ paid instrument — doesn't deplete</div>`}`;
};

// ---------- contact panel ----------
const panel = $("#panel");
viz.onSelect = (n) => renderPanel(n);

function dots(n, max, cls) {
  let s = "";
  for (let i = 1; i <= max; i++) s += `<span class="d ${i <= n ? "on " + (cls || "") : ""}"></span>`;
  return `<span class="dots">${s}</span>`;
}

function renderPanel(n) {
  document.body.classList.toggle("panel-open", !!n);
  if (!n) { panel.classList.remove("show"); return; }
  panel.classList.add("show");
  if (!n.rated) {
    panel.innerHTML = `<button class="x" onclick="closePanel()">×</button>
      <h2>${n.name}</h2><p class="muted">${[n.role, n.org].filter((x) => x && x !== "—").join(" · ")}</p>
      <div class="unknown-block">In the roster, not yet rated. His closest people barely show up in the data —
      low signal here means <em>unknown</em>, never unimportant.<br><br>The fix is thirty seconds of voice:
      “tell me about ${n.name.split(" ")[0]}.”</div>`;
    return;
  }
  const cap = n.flags?.paid ? 1 : n.capacity;
  const cd = COOLDOWN[n.access];
  const daysToFull = n.flags?.paid ? 0 : Math.max(0, Math.round(cd * (1 - cap)));
  const flags = Object.entries(n.flags || {}).map(([k, v]) => {
    const icon = { domainGate: "⛩", buildVsBuy: "🔧", noSalesOptics: "🚫", localPref: "🌏", paid: "▣" }[k] || "⚠";
    return `<div class="flag"><span class="fi">${icon}</span>${v}</div>`;
  }).join("");
  const m = currentMatches?.get(n.id);
  const matchBlock = m && currentCompany ? `
    <div class="sect">Against <strong style="color:${currentCompany.hue}">${currentCompany.name}</strong></div>
    <div class="mrow"><span>Best angle</span><em>“${m.angle.name}”</em></div>
    <div class="mrow"><span>Relevance</span>${meter(m.relevance)}</div>
    <div class="mrow"><span>Opener fit</span>${meter(m.openerFit)}</div>
    <div class="mrow"><span>Affordability</span>${meter(m.affordability)}</div>
    ${m.warnings.length ? `<div class="warns">${m.warnings.map((w) => `<span>⚠ ${w}</span>`).join("")}</div>` : ""}
    <button class="dojo-btn" onclick="openDojo('${n.id}')">⛩ &nbsp;Rehearse in the Dojo</button>`
    : `<div class="pick-co">Select a company above to score this contact — then rehearse the ask in the Dojo before spending the real thing.</div>`;

  panel.innerHTML = `<button class="x" onclick="closePanel()">×</button>
    <h2>${n.name}${n.hub ? ' <span class="hub-tag">hub</span>' : ""}</h2>
    <p class="muted">${n.role} · ${n.org}${n.region ? " · " + n.region : ""}</p>
    <div class="mrow"><span>Access depth</span>${dots(n.access, 5)}</div>
    <div class="mrow"><span>Openness</span>${dots(n.openness, 3, "violet")}</div>
    <div class="mrow"><span>Authority</span>${dots(n.authority, 3)}</div>
    <div class="cap-block">
      <div class="cap-head"><span>Ask capacity</span><span class="${cap < 0.35 ? "low" : ""}">${n.flags?.paid ? "∞ (paid)" : Math.round(cap * 100) + "%"}</span></div>
      <div class="cap-bar big"><span style="width:${cap * 100}%;background:${n.dormant ? "#d03b3b" : cap < 0.35 ? "#fab219" : "#fff"}"></span></div>
      <div class="cap-foot muted">${n.flags?.paid ? "purchased instrument — costs money, not goodwill" :
        n.dormant ? "⚠ dormant — no response in 2+ years" :
        cap >= 0.99 ? `fully charged · cooldown ${cd}d` : `recharging · ~${daysToFull}d to full · last ask ${n.daysSinceAsk}d ago`}</div>
    </div>
    ${n.activeWith?.length ? `<div class="mrow"><span>Active with</span><em>${n.activeWith.map((id) => COMPANIES.find((c) => c.id === id)?.name).join(", ")}</em></div>` : ""}
    ${n.pain.length ? `<div class="tags">${n.pain.map((p) => `<span class="tag">${PAIN_LABELS[p] || p}</span>`).join("")}</div>` : ""}
    ${flags}
    <div class="note">${n.note}</div>
    ${matchBlock}`;
}
function meter(v) { return `<span class="cap-bar sm"><span style="width:${v * 100}%"></span></span>`; }
window.closePanel = () => { viz.selected = null; panel.classList.remove("show"); document.body.classList.remove("panel-open"); };

// ---------- the Dojo ----------
let dojoState = null;
window.openDojo = (id) => {
  const c = viz.nodeById[id];
  const m = currentMatches.get(id);
  const reh = buildRehearsal(c, currentCompany, m);
  dojoState = { c, m, reh, spent: null };
  $("#dojo").classList.add("show");
  $("#dojo-title").innerHTML = `The Dojo — rehearsing <strong>${c.name}</strong> for <strong style="color:${currentCompany.hue}">${currentCompany.name}</strong>`;
  $("#dojo-angle").innerHTML = `Angle: <em>“${m.angle.name}”</em> <span class="muted">(strength ${m.angle.strength}/3 · ${STYLE_LABELS[m.angle.style]})</span>`;
  const chat = $("#dojo-chat"); chat.innerHTML = "";
  addMsg("twin", reh.greet, c.name);
  const choices = $("#dojo-choices"); choices.innerHTML = "";
  choices.appendChild(el("div", "ch-label", "Choose your opener — this is the rehearsal:"));
  for (const oc of reh.openerChoices) {
    const b = el("button", "choice", `${oc.label} <span class="ch-tag">${oc.tag}</span>`);
    b.onclick = () => playOpener(oc);
    choices.appendChild(b);
  }
  renderGauge(c.flags?.paid ? 1 : c.capacity, 0);
  $("#dojo-verdict").innerHTML = "";
};

function addMsg(who, text, name) {
  const chat = $("#dojo-chat");
  chat.appendChild(el("div", `msg ${who}`, `<span class="who">${who === "twin" ? name + "’s twin" : "You"}</span>${text}`));
  chat.scrollTop = chat.scrollHeight;
}

function playOpener(oc) {
  const { c, reh } = dojoState;
  addMsg("me", oc.label.replace(/<[^>]*>/g, ""));
  $("#dojo-choices").innerHTML = "";
  setTimeout(() => {
    const res = reh.respond(oc.id);
    addMsg("twin", res.line, c.name);
    dojoState.spent = res;
    const cap0 = c.flags?.paid ? 1 : c.capacity;
    renderGauge(cap0, res.cost);
    setTimeout(() => renderVerdict(res), 500);
  }, 550);
}

function renderGauge(cap, cost) {
  const spend = Math.min(cap, cost);
  $("#gauge").innerHTML = `
    <div class="g-label">Relationship cost</div>
    <div class="g-bar">
      <span class="g-cap" style="width:${cap * 100}%"></span>
      <span class="g-spend" style="left:${(cap - spend) * 100}%;width:${spend * 100}%"></span>
    </div>
    <div class="g-foot muted">${cost === 0 ? "no goodwill spent" : `this ask spends ${Math.round(spend * 100)}% → leaves ${Math.round((cap - spend) * 100)}%`}</div>`;
}

function renderVerdict(res) {
  const { c, m } = dojoState;
  const meta = OUTCOME_META[res.outcome];
  const cap0 = c.flags?.paid ? 1 : c.capacity;
  const spend = Math.min(cap0, res.cost);
  const left = Math.max(0, cap0 - spend);
  const cd = COOLDOWN[c.access];
  const altAngle = currentCompany.angles.find((a) => a.id !== m.angle.id);
  $("#dojo-verdict").innerHTML = `
    <div class="verdict v-${meta.cls}">
      <div class="v-head"><span class="v-badge">${meta.label}</span>
      ${res.cost > 0 ? `<span class="muted">spends ${Math.round(spend * 100)}% · leaves ${Math.round(left * 100)}% · ~${Math.round(cd * res.cost)}d to recover</span>` : `<span class="muted">zero goodwill spent</span>`}</div>
      <div class="v-advice">${meta.advice}</div>
      ${altAngle && meta.cls !== "good" ? `<div class="v-alt">Try the other angle: <em>“${altAngle.name}”</em></div>` : ""}
      <div class="v-actions">
        <button class="ghost" onclick="openDojo('${c.id}')">↺ Rehearse again</button>
        <button class="ghost" onclick="closeDojo()">Close</button>
        ${meta.cls === "good" ? `<button class="primary">✓ Make it real — log the ask</button>` : ""}
      </div>
    </div>`;
}
window.closeDojo = () => $("#dojo").classList.remove("show");

// ---------- voice pass demo ----------
$("#voice-btn").onclick = () => {
  const vm = $("#voice"); vm.classList.add("show");
  const body = $("#voice-body");
  body.innerHTML = `<div class="rec"><span class="rec-dot"></span> voice note · this morning, between meetings</div><div id="vtext" class="vtext"></div>`;
  let i = 0; const txt = VOICE_DEMO.transcript;
  const t = setInterval(() => {
    $("#vtext").textContent = txt.slice(0, i += 3);
    if (i >= txt.length) {
      clearInterval(t);
      setTimeout(() => {
        const d = VOICE_DEMO.diff;
        body.appendChild(el("div", "diff",
          `<div class="d-head">Proposed update — <strong>${viz.nodeById[d.contactId].name}</strong> <span class="muted">(extract → propose → he corrects; never silently resolve)</span></div>` +
          d.changes.map((ch) => `<div class="d-row"><span class="d-field">${ch.field}</span><span class="d-from">${ch.from}</span> → <span class="d-to">${ch.to}</span></div>`).join("") +
          `<div class="v-actions"><button class="primary" id="v-confirm">✓ Confirm</button><button class="ghost" onclick="document.getElementById('voice').classList.remove('show')">Not now</button></div>`));
        $("#v-confirm").onclick = () => {
          const c = viz.contacts.find((x) => x.id === d.contactId); // mutate the source record, not the layout copy
          c.access = 4; c.capacity = 1; c.daysSinceAsk = 0;
          c.org = "New district (per Jacob)"; c.role = "Assistant superintendent";
          c.note = "“Just changed districts. Texting me back same day.” Voice beats the LinkedIn export — his account wins, the old org keeps as history.";
          viz.layout(); viz.pulse(d.contactId);
          $("#voice").classList.remove("show");
          viz.selected = d.contactId; renderPanel(viz.nodeById[d.contactId]);
          if (currentCompany) selectCompany(currentCompany);
        };
      }, 400);
    }
  }, 24);
};
$("#voice-close").onclick = () => $("#voice").classList.remove("show");

viz.draw();

// Deep-link / demo driver: #co=zen&sel=eric-brooks&dojo=1&opener=theirs
{
  const p = new URLSearchParams(location.hash.slice(1));
  const co = COMPANIES.find((c) => c.id === p.get("co"));
  if (co) selectCompany(co);
  const sel = p.get("sel");
  if (sel && viz.nodeById[sel]) { viz.selected = sel; renderPanel(viz.nodeById[sel]); }
  if (p.get("dojo") && co && sel) {
    openDojo(sel);
    const op = p.get("opener");
    if (op) setTimeout(() => playOpener(dojoState.reh.openerChoices.find((o) => o.id === op) || dojoState.reh.openerChoices[0]), 300);
  }
  if (p.get("voice")) $("#voice-btn").click();
}
