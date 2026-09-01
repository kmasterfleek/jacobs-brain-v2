// The Intern: proposes contact×company matches from the files, learns from
// Jacob's corrections. All learning is deterministic and displayed in plain
// English. Every response is appended to an exportable training log — the
// labeled corpus a future model trains on. Data + log stay on this machine.

const COMPANIES = [
  { id: "tsl", name: "Third Space Learning", kw: ["math", "tutor", "academic", "achievement", "curriculum", "instruction", "learning"],
    angles: ["Free math tutoring — Stanford & Cornell studied, Gates funded", "Prove it on one cohort, scale on your terms"] },
  { id: "zen", name: "Zen Educate", kw: ["special ed", "sped", "staffing", "personnel", "hr", "business", "cfo", "finance", "retention"],
    angles: ["$500K–$1M off special-ed agency staffing fees", "Fill the vacancies you can't fill, minus the agency markup"] },
  { id: "nv", name: "NVIDIA-backed K-12 AI", kw: ["ai", "technology", "tech", "innovation", "digital", "cto", "cio", "stem", "computer"],
    angles: ["NVIDIA is putting real money into K-12 — there's a seat at the table", "Higher-ed-grade AI tooling, free to participate"] },
];
const BUYER_RE = /(superintendent|supe\b|asst|assistant sup|cabinet|chief|cio|cto|cao|director|principal|exec|head)/i;

// ---- seed knowledge from voice pass 1 (so it starts already knowing what he said) ----
const SEED = [
  { match: "eric brooks", fact: { lane: ["literacy", "mtss", "state program"] }, text: "Eric Brooks has a lane — literacy, MTSS, state programs. I won’t suggest him off-lane." },
  { match: "greg", exact: true, fact: { builds: true }, text: "Greg (Arcadia) builds things himself — great validator, wrong buyer." },
  { match: "lk", exact: true, fact: { noSales: true }, text: "The former Alameda COE supe must never be near anything that smells like selling." },
  { match: "sandra garcia", fact: { dormant: true }, text: "Sandra Garcia hasn’t responded in 2+ years — dormant line, no asks." },
  { match: "kiela jimenez", fact: { paid: true }, text: "Kiela Jimenez is a paid advisor ($/hr) — an instrument, not a pitch target." },
  { match: "allen pratt", fact: { connector: true }, text: "Allen Pratt is a multiplier — ask him for the map, not the meeting." },
  { match: "jeff piontek", fact: { connector: true }, text: "Jeff Piontek is a connector into Clark County & NYC — validator and door, not buyer." },
  { match: "kurtis pake", fact: { stale: "changed districts — files don’t know where yet" }, text: "Kurtis Pake changed districts; the files are stale on him until Jacob says where." },
];

const REJECT_CHIPS = [
  { id: "lane", label: "Wrong lane for them" },
  { id: "builds", label: "They build it themselves" },
  { id: "nosales", label: "Can’t look like a seller" },
  { id: "connector", label: "Connector, not a buyer" },
  { id: "notclose", label: "Relationship isn’t there" },
  { id: "toosoon", label: "Too soon — asked recently" },
  { id: "stale", label: "Info is stale / wrong" },
  { id: "small", label: "Org too small for this" },
  { id: "other", label: "Something else…" },
];
const GOODBUT_CHIPS = [
  { id: "angle", label: "Right person, other angle" },
  { id: "later", label: "Yes, but later" },
  { id: "referral", label: "Ask them for referrals instead" },
];

// ---- state ----
const LS = "dodo-intern-v1";
let S = JSON.parse(localStorage.getItem(LS) || "null") || {
  facts: {},          // name -> {lane[], builds, noSales, connector, dormant, paid, stale, small, accessDown, cooldown}
  pairs: {},          // "name|co" -> good | no | later | angle2
  log: [],            // full training log
  reasonCounts: {},   // reason id -> [{name, role}]
  globalRules: [],    // learned pattern rules {id, text}
  agree: 0, total: 0,
  seeded: false,
};
if (!S.seeded) {
  for (const s of SEED) {
    const hit = POOL.find(p => s.exact ? p.name.toLowerCase() === s.match : p.name.toLowerCase().includes(s.match));
    if (hit) S.facts[hit.name] = { ...(S.facts[hit.name] || {}), ...s.fact, seedText: s.text };
  }
  S.seeded = true; save();
}
function save() { localStorage.setItem(LS, JSON.stringify(S)); }
const $ = s => document.querySelector(s);

// ---- scoring ----
function warmth(p) {
  let w = 0;
  if (p.msgs) w += Math.min(1, Math.log10(1 + p.msgs[0] + p.msgs[1]) / 2) * 0.5;
  if (p.latencyH != null && p.latencyH < 2) w += 0.25;
  if (p.mentions) w += Math.min(0.25, p.mentions / 100);
  const recent = [p.lastMsg, p.lastMention].filter(Boolean).sort().pop();
  if (recent && recent >= "2026-01") w += 0.15;
  return Math.min(1, w);
}
function fit(p, co) {
  const hay = (p.role + " " + p.org + " " + p.notes).toLowerCase();
  let hits = co.kw.filter(k => hay.includes(k)).length;
  return Math.min(1, hits / 2);
}
function score(p, co) {
  const f = S.facts[p.name] || {};
  let s = 0.4 * fit(p, co) + 0.3 * warmth(p) + (BUYER_RE.test(p.role) ? 0.2 : 0.05) + (p.notes ? 0.05 : 0) + (p.status ? 0.05 : 0);
  if (f.lane && !co.kw.some(k => f.lane.join(" ").includes(k))) s *= 0.15;
  if (f.builds) s *= 0.3;
  if (f.noSales) s *= 0.3;
  if (f.dormant || f.paid || f.stale) s = 0;
  if (f.notclose) s *= 0.5;
  if (f.small) s *= 0.6;
  if (f.cooldown && S.total < f.cooldown) s *= 0.1;
  for (const r of S.globalRules) {
    if (r.id === "formers-multiply" && /former|retired|consultant/i.test(p.role) && !f.connector) s *= 0.5;
    if (r.id === "state-routes" && /state|dept|department of ed/i.test(p.org + p.orgType)) s *= 0.5;
    if (r.id === "size-matters" && co.id === "zen" && /charter|private|academy\b/i.test(p.orgType)) s *= 0.6;
  }
  return s;
}

// ---- suggestion picker: 70% best unreviewed, 30% uncertainty probe ----
let current = null, mode = null, chosenReason = null;
function nextCard() {
  const cands = [];
  for (const p of POOL) {
    for (const co of COMPANIES) {
      const key = p.name + "|" + co.id;
      if (S.pairs[key]) continue;
      const f = S.facts[p.name] || {};
      if (f.dormant || f.paid || f.stale) continue;
      cands.push({ p, co, s: score(p, co), key, connector: !!f.connector });
    }
  }
  cands.sort((a, b) => b.s - a.s);
  if (!cands.length) { renderDone(); return; }
  const probeMode = S.total > 2 && S.total % 3 === 2;
  let pick;
  if (probeMode) {
    pick = cands.find(c => c.s > 0.25 && c.s < 0.5 && !c.p.msgs) || cands.find(c => c.s > 0.25 && c.s < 0.5) || cands[0];
    pick.probe = true;
  } else pick = cands[0];
  current = pick;
  renderCard(pick);
}

function evidence(p) {
  const ev = [];
  if (p.msgs) ev.push(`${p.msgs[0]}/${p.msgs[1]} messages, ${p.latencyH != null ? "~" + p.latencyH + "h reply time" : "latency unknown"}${p.lastMsg ? ", last " + p.lastMsg : ""}`);
  if (p.mentions) ev.push(`${p.mentions} comment mentions over the years${p.lastMention ? ", last " + p.lastMention : ""}`);
  if (p.notes) ev.push(`your note: “${p.notes.slice(0, 90)}”`);
  if (p.status) ev.push(`roster status: ${p.status}`);
  if (!ev.length) ev.push("thin file — I only have the roster row. That’s why I’m asking.");
  return ev;
}

function renderCard(c) {
  const { p, co } = c;
  const f = S.facts[p.name] || {};
  const asReferral = f.connector;
  const kws = co.kw.filter(k => (p.role + " " + p.org + " " + p.notes).toLowerCase().includes(k));
  $("#card").innerHTML = `
    <div class="kind ${c.probe ? "probe" : "confident"}">${c.probe ? "checking my read" : asReferral ? "referral suggestion" : "match suggestion"}</div>
    <h2>${p.name}</h2>
    <div class="who">${[p.role, p.org, p.state].filter(Boolean).join(" · ")}</div>
    <div class="for-line">${asReferral ? "Ask for doors into" : "Put in front of"} <span class="co">${co.name}</span></div>
    <div class="angle">“${co.angles[0]}”</div>
    <div class="why">
      ${kws.length ? `<div>fit: their world touches ${kws.join(", ")}</div>` : `<div>fit: unproven — I'm going on role and org type</div>`}
      ${evidence(p).map(e => `<div class="evidence">${e}</div>`).join("")}
    </div>
    ${f.seedText ? `<div class="known">already know: ${f.seedText}</div>` : ""}`;
  $("#chips-no").classList.remove("open");
  $("#chips-gb").classList.remove("open");
  $("#whybox").classList.remove("open");
  $("#toast").classList.remove("show");
}

function renderDone() {
  $("#card").innerHTML = `<div class="kind confident">caught up</div><h2>I'm out of confident suggestions.</h2>
    <div class="who">Export the training log, or reset to keep drilling.</div>`;
}

// ---- learning ----
function learn(reasonId, whyText) {
  const { p, co } = current;
  const f = S.facts[p.name] = S.facts[p.name] || {};
  let lesson = "";
  switch (reasonId) {
    case "lane": f.lane = whyText ? whyText.toLowerCase().split(/[,;]+/).map(s => s.trim()).filter(Boolean) : ["(unstated)"];
      lesson = `${p.name} has a lane${whyText ? ": " + whyText : ""} — I'll stop suggesting off-lane.`; break;
    case "builds": f.builds = true; lesson = `${p.name} builds it themselves — validator, not buyer.`; break;
    case "nosales": f.noSales = true; lesson = `${p.name} can't be near anything that looks like selling.`; break;
    case "connector": f.connector = true; lesson = `${p.name} is a connector — I'll suggest referral asks, not pitches.`; break;
    case "notclose": f.notclose = true; lesson = `The relationship with ${p.name} is thinner than the files imply.`; break;
    case "toosoon": f.cooldown = S.total + 20; lesson = `${p.name} was asked recently — resting them a while.`; break;
    case "stale": f.stale = whyText || "flagged wrong"; lesson = `My file on ${p.name} is wrong${whyText ? " — " + whyText : ""}. Muting until corrected.`; break;
    case "small": f.small = true; lesson = `${p.org || p.name} is too small for asks like this.`; break;
    case "other": lesson = whyText ? `Noted on ${p.name}: “${whyText}”` : `Noted — I'll weigh this pairing down.`; break;
    case "angle": S.pairs[p.name + "|" + co.id] = "angle2"; lesson = `${p.name} for ${co.name}: yes, but open with “${co.angles[1]}”.`; break;
    case "later": S.pairs[p.name + "|" + co.id] = "later"; lesson = `${p.name} for ${co.name}: right idea, wrong week. Parked.`; break;
    case "referral": f.connector = true; S.pairs[p.name + "|" + co.id] = "referral"; lesson = `${p.name}: ask for doors, not meetings.`; break;
  }
  // pattern detection
  if (["connector", "small", "lane", "notclose"].includes(reasonId)) {
    (S.reasonCounts[reasonId] = S.reasonCounts[reasonId] || []).push({ name: p.name, role: p.role, orgType: p.orgType });
    detectPatterns(reasonId);
  }
  return lesson;
}

function detectPatterns(reasonId) {
  const rc = S.reasonCounts[reasonId] || [];
  const has = id => S.globalRules.some(r => r.id === id);
  const formers = rc.filter(x => /former|retired|consultant/i.test(x.role));
  if (reasonId === "connector" && formers.length >= 3 && !has("formers-multiply")) {
    addRule("formers-multiply", `Pattern: three “formers” marked connector-not-buyer. I now treat Former/consultant titles as multipliers by default.`);
  }
  const state = rc.filter(x => /state|dept/i.test(x.orgType));
  if (["connector", "lane"].includes(reasonId) && state.length >= 3 && !has("state-routes")) {
    addRule("state-routes", `Pattern: state-agency people keep getting redirected. I'll rank them as routers, not buyers.`);
  }
  const small = (S.reasonCounts.small || []);
  if (small.length >= 3 && !has("size-matters")) {
    addRule("size-matters", `Pattern: org size keeps disqualifying picks — I'll weight size much harder, especially for staffing plays.`);
  }
}
function addRule(id, text) {
  S.globalRules.push({ id, text });
  const el = $("#pattern"); el.innerHTML = `<b>New pattern learned.</b> ${text}`; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 6000);
}

// ---- responses ----
function record(action, reasonId, whyText, agreed) {
  const { p, co } = current;
  S.total++; if (agreed) S.agree++;
  S.log.push({ t: new Date().toISOString(), name: p.name, role: p.role, org: p.org, company: co.name,
    suggested_as: (S.facts[p.name] || {}).connector ? "referral" : "match", probe: !!current.probe,
    action, reason: reasonId || null, why: whyText || null });
  save(); refreshPanels();
}
function toast(msg) { const t = $("#toast"); t.innerHTML = msg; t.classList.add("show"); }

$("#b-good").onclick = () => {
  const { p, co } = current;
  S.pairs[p.name + "|" + co.id] = "good";
  record("good", null, null, true);
  toast(`<b>Queued.</b> ${p.name} → ${co.name}. It's in your call list below.`);
  setTimeout(nextCard, 900);
};
$("#b-skip").onclick = () => { const { p, co } = current; S.pairs[p.name + "|" + co.id] = "skip"; record("skip", null, null, false); nextCard(); };
$("#b-no").onclick = () => { mode = "no"; openChips("#chips-no", REJECT_CHIPS); };
$("#b-goodbut").onclick = () => { mode = "gb"; openChips("#chips-gb", GOODBUT_CHIPS); };

function openChips(sel, chips) {
  const el = $(sel);
  el.innerHTML = chips.map(c => `<button class="chip" data-id="${c.id}">${c.label}</button>`).join("");
  el.classList.add("open");
  ($(sel === "#chips-no" ? "#chips-gb" : "#chips-no")).classList.remove("open");
  el.querySelectorAll(".chip").forEach(b => b.onclick = () => {
    chosenReason = b.dataset.id;
    el.classList.remove("open");
    $("#whybox").classList.add("open");
    $("#why").value = ""; $("#why").focus();
    $("#why").placeholder = chosenReason === "lane" ? "what IS their lane? (e.g. literacy, MTSS)" :
      chosenReason === "stale" ? "what's the correction?" : "tell me why — a sentence is plenty…";
  });
}
$("#why-done").onclick = () => {
  const whyText = $("#why").value.trim();
  const lesson = learn(chosenReason, whyText);
  const isNo = mode === "no";
  if (isNo) { const { p, co } = current; if (!S.pairs[p.name + "|" + co.id]) S.pairs[p.name + "|" + co.id] = "no"; }
  record(isNo ? "no" : "good_but", chosenReason, whyText, !isNo);
  $("#whybox").classList.remove("open");
  toast(`<b>Got it.</b> ${lesson}`);
  setTimeout(nextCard, 1400);
};

// mic (Web Speech API where available)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SR) {
  const rec = new SR(); rec.lang = "en-US"; rec.interimResults = false;
  let on = false;
  $("#mic").onclick = () => {
    if (on) { rec.stop(); return; }
    on = true; $("#mic").classList.add("rec"); rec.start();
  };
  rec.onresult = e => { $("#why").value = e.results[0][0].transcript; };
  rec.onend = () => { on = false; $("#mic").classList.remove("rec"); };
} else $("#mic").style.display = "none";

// ---- panels ----
function refreshPanels() {
  $("#st-n").textContent = S.total;
  $("#st-agree").textContent = S.total ? Math.round((S.agree / S.total) * 100) + "%" : "–";
  const learned = [];
  for (const [name, f] of Object.entries(S.facts)) {
    if (f.seedText) learned.push({ text: f.seedText, src: "from your voice pass" });
  }
  for (const e of S.log.filter(l => l.reason && l.reason !== "other")) {
    const label = [...REJECT_CHIPS, ...GOODBUT_CHIPS].find(c => c.id === e.reason)?.label || e.reason;
    learned.push({ text: `${e.name}: ${label}${e.why ? " — “" + e.why + "”" : ""}`, src: e.t.slice(0, 10), fresh: true });
  }
  for (const r of S.globalRules) learned.push({ text: r.text, src: "pattern", fresh: true });
  $("#st-rules").textContent = S.globalRules.length + S.log.filter(l => l.reason).length;
  $("#n-learned").textContent = learned.length;
  $("#learned").innerHTML = learned.slice(-14).reverse().map(l =>
    `<div${l.fresh ? ' class="new"' : ""}>${l.text} <span class="src">· ${l.src}</span></div>`).join("") || "<div>nothing yet — react to a card.</div>";
  const q = Object.entries(S.pairs).filter(([, v]) => ["good", "angle2", "referral"].includes(v));
  $("#n-queue").textContent = q.length;
  $("#queue").innerHTML = q.map(([k, v]) => {
    const [name, coId] = k.split("|"); const co = COMPANIES.find(c => c.id === coId);
    return `<div><b>${name}</b> → ${co.name}${v === "angle2" ? " (second angle)" : v === "referral" ? " (referral ask)" : ""}</div>`;
  }).join("") || "<div>empty — approve something.</div>";
  $("#foot-note").textContent = `${S.log.length} responses logged · this log is the training set for the real model`;
}

$("#export").onclick = () => {
  const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), facts: S.facts, rules: S.globalRules, log: S.log }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "intern-training-log.json"; a.click();
};
$("#reset").onclick = () => { if (confirm("Wipe everything the intern has learned this session?")) { localStorage.removeItem(LS); location.reload(); } };

refreshPanels();
nextCard();
