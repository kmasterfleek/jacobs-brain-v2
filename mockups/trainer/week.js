// This-week demo: calendar transcribed from Jacob's Google Calendar screenshot
// (week of Aug 17-21, 2026). Replace with ICS import when available.
// The intern preps each meeting from the files + learned judgments, warns on
// ask-stacking, and captures a 10-second outcome after — same training log.

const CAL_COMPANIES = {
  studyfetch: { name: "Study Fetch", hue: "#5aa4e0" },
  upstart: { name: "Upstart Ed", hue: "#c987d8" },
  pearl: { name: "Pearl", hue: "#d8b34e" },
  samlabs: { name: "SAM Labs", hue: "#e0835a" },
  telecom: { name: "Mission Telecom", hue: "#7fc7b1" },
  tsl: { name: "Third Space Learning", hue: "#6db2e8" },
  crimson: { name: "Crimson Education", hue: "#d87a7a" },
  knowt: { name: "Knowt", hue: "#9d93e6" },
  ets: { name: "ETS", hue: "#8fb573" },
  zen: { name: "Zen Educate", hue: "#e09a5a" },
  nvidia: { name: "NVIDIA co.", hue: "#55b18e" },
};

// day: 0=Mon..4=Fri · kind: client|intro|internal|personal|task|hold
const CAL = [
  { day: 0, t: "7:00", title: "LOOK at each company's hit list — make a targeted list", kind: "task",
    prep: "This task IS the intern. The matchboard in docs/client-matchboard is this list, pre-verified. Review it instead of building from scratch." },
  { day: 0, t: "8:00", title: "Study Fetch Team + Jason Bell (Polk Co, TN)", co: ["studyfetch"], kind: "client",
    contacts: ["Jason Bell"], prep: "Jason Bell — thin file. Polk Co TN is a new geography for the graph. After: one line on him." },
  { day: 0, t: "8:30", title: "Jacob · Michael · Vinay Weekly", kind: "internal" },
  { day: 0, t: "9:00", title: "BRIDGES outbound · Interstate AI Standing · Upstart Ed · Pearl (John)", co: ["upstart", "pearl"], kind: "client" },
  { day: 0, t: "9:30", title: "CALIE/CUE + Study Fetch — Chris Hoang suggestions", co: ["studyfetch"], kind: "client",
    prep: "CUE orbit — Mike Lawrence (ABC Unified, ex-conference head) is the roster's CUE-adjacent contact. Email-only, no text." },
  { day: 0, t: "10:00", title: "Chief DODO intros — James Blomfield · Ben Greiner · Jenna Fuentes", kind: "intro" },
  { day: 0, t: "11:45", title: "Quick check-ins — Rachael Mann · Steven Pechter", kind: "intro" },
  { day: 0, t: "12:30", title: "SAM Labs × DODO", co: ["samlabs"], kind: "client" },
  { day: 0, t: "13:00", title: "Dr. Brad Mason + Fontana (×2)", contacts: ["Brad Mason"], kind: "client",
    prep: "Fontana USD — big San Bernardino district. If SPED staffing comes up, that's a Zen-sized org." },
  { day: 0, t: "14:00", title: "Chief DODO intros — Trisha Thomas · Mario Vasilescu", kind: "intro" },
  { day: 0, t: "15:00", title: "Greg + Jacob", contacts: ["Greg"], kind: "client",
    prep: "Greg (Arcadia): I know — he builds it himself. Wrong buyer, PERFECT validator. If the NVIDIA product needs a technical read before Antonio Vigil sees it, this meeting is free due diligence.",
    flag: "Don't pitch. Ask for a technical opinion — that's a give to him." },
  { day: 0, t: "16:00", title: "Chief DODO intro — Dhrew Hannah", kind: "intro" },
  { day: 0, t: "18:00", title: "LUKE KARATE", kind: "personal" },

  { day: 1, t: "7:00", title: "Invoices · Roberto (Upstart)", co: ["upstart"], kind: "task" },
  { day: 1, t: "8:30", title: "TSL + DODO Weekly", co: ["tsl"], kind: "client",
    prep: "Matchboard for TSL: Steve Iglesias ask in flight (confirm his signing scope is network-level). Fresh: Kurtis Pake — but confirm his NEW district first; the files are stale on him. Piontek deferred (NVIDIA active)." },
  { day: 1, t: "9:00", title: "Jacob | Ira · Jacob + Sam W.", kind: "internal" },
  { day: 1, t: "9:30", title: "Dr. Brad Mason + Team · Dr. Sanchez + Jeremy", kind: "client" },
  { day: 1, t: "10:30", title: "DODO × Mission Telecom kickoff", co: ["telecom"], kind: "client",
    prep: "New client kickoff — first question for the graph: which pain tags does Telecom actually solve? (devices_and_infrastructure is the likely lane.)" },
  { day: 1, t: "11:00", title: "Whittney Smith (Mineola UFSD) + Upstart Education", co: ["upstart"], contacts: ["Whitney Smith"], kind: "client",
    prep: "Whitney Smith: access 4 — texts, responds right away (Womble referral).",
    stale: "My file says 'CTO, New Jersey District' — this calendar says Mineola UFSD (NY). One of us is wrong. Correct me after." },
  { day: 1, t: "12:00", title: "Chief DODO intros — Patrick Leonard · Megan Benay", kind: "intro" },
  { day: 1, t: "13:00", title: "Pearl × JK K12 Standing", co: ["pearl"], kind: "client" },
  { day: 1, t: "13:45", title: "Quick check-in — Sean Bulson", contacts: ["Sean Bulson"], kind: "intro" },
  { day: 1, t: "14:00", title: "Adella + Jacob", kind: "internal" },
  { day: 1, t: "16:00", title: "Dr. Ga… (Teams) · HOLD SD COE (Gabe) · ETS hold", co: ["ets"], kind: "hold",
    prep: "San Diego COE for ETS — county office = router + aggregator, exactly the consortium shape." },
  { day: 1, t: "17:00", title: "Tax file — remind Adella", kind: "task" },

  { day: 2, t: "8:00", title: "OUTREACH block", kind: "task",
    prep: "The approved queue in the trainer is this block, pre-loaded: Vigil→NVIDIA, Pratt→Zen, Womble→NVIDIA (give-first). One ask per person." },
  { day: 2, t: "9:00", title: "Southwest Georgia RESA + PEARL", co: ["pearl"], kind: "client",
    prep: "RESA = regional service agency — same pooled-demand shape as a county office. If Pearl lands here it lands at multi-district scale." },
  { day: 2, t: "9:30", title: "Jacob / Jeff", contacts: ["Jeff Piontek"], kind: "client",
    prep: "If this is Piontek: his NVIDIA ask is the active one. The question the voice pass says never gets asked — ask it: 'who can you get this TO?' Clark County and NYC are the prize.",
    flag: "One ask only. His Zen and TSL fits wait until NVIDIA closes." },
  { day: 2, t: "10:00", title: "Grant Management — Lynwood Partners Edu", kind: "client",
    prep: "Lynwood in your week: the swarm found Patrick Gittisriboongul is likely now SUPERINTENDENT there (files disagree). Today's the day to confirm — it changes him from champion to buyer on the Zen board." },
  { day: 2, t: "11:00", title: "Standing — Eddi · Jacob + Jeremy", kind: "internal" },
  { day: 2, t: "11:30", title: "Team Study Fetch + Dr. Matt Mallison — South Fayette", co: ["studyfetch"], kind: "client" },
  { day: 2, t: "12:00", title: "Crimson Education + Dr. Rick Fernandez — TALAS", co: ["crimson"], contacts: ["Rick Fernandez"], kind: "client",
    prep: "Fernandez appears twice this week (also Thu with ETS). Two companies, one person, two days apart." ,
    flag: "Ask-stacking: from his seat that's two asks in one week. Pick which company this relationship serves best right now."},
  { day: 2, t: "12:30", title: "Chief DODO intro — Damian Mathe…", kind: "intro" },
  { day: 2, t: "13:00", title: "Santa Clara USD + Study Fetch — NVIDIA chat", co: ["studyfetch", "nvidia"], kind: "client",
    prep: "Santa Clara USD in an NVIDIA conversation — add their attempt history to the graph after: what have they already tried in AI?" },
  { day: 2, t: "13:30", title: "Chief DODO intro — Dawn Hosni", kind: "intro" },
  { day: 2, t: "14:00", title: "Crimson + Mater Brickell — Steve Iglesias", co: ["crimson"], contacts: ["Steve Iglesias"], kind: "client",
    prep: "Steve: access 5, 26-min median reply, TSL ask already in flight.",
    flag: "This is Crimson in front of him, Knowt is tomorrow, TSL is active. THREE companies in one week — from Steve's seat, that's you asking three times. Consider making one of these a pure give." },
  { day: 2, t: "15:00", title: "Chief DODO intro · HOLD SD COE (Gabe) · Ben Greiner", kind: "intro" },

  { day: 3, t: "8:00", title: "Jenn / Jacob · OUTREACH block", kind: "internal" },
  { day: 3, t: "10:00", title: "Oregon DOE + SAM Labs", co: ["samlabs"], kind: "client",
    prep: "State DOE = router, not buyer. The ask that works: 'which three districts should pilot this?'" },
  { day: 3, t: "10:30", title: "Oregon DOE + ZEN — SPED SUB Learning", co: ["zen"], kind: "client",
    prep: "Zen at a state agency: aim for the routing outcome — Oregon districts with real agency spend. Ask for the map." },
  { day: 3, t: "11:00", title: "Chief DODO intro — Rob Magliano", kind: "intro" },
  { day: 3, t: "11:30", title: "Contra Costa COE + Study Fetch", co: ["studyfetch"], kind: "client",
    prep: "County office again — the aggregator pattern. Contra Costa can put Study Fetch in front of 18 districts at once." },
  { day: 3, t: "12:00", title: "Jacob / Sara — Standing", kind: "internal" },
  { day: 3, t: "12:30", title: "Dr. Rick Fernandez + Team ETS", co: ["ets"], contacts: ["Rick Fernandez"], kind: "client",
    flag: "Second Fernandez meeting this week (Crimson was Wed). Same person, second company." },
  { day: 3, t: "13:00", title: "Crimson Weekly", co: ["crimson"], kind: "client" },
  { day: 3, t: "14:00", title: "Team Knowt + Steve — Mater Brickell — Bridges", co: ["knowt"], contacts: ["Steve Iglesias"], kind: "client",
    flag: "Steve again — second company in his room in two days (third counting the live TSL ask). If one of this week's two meetings can be a give, make it this one." },
  { day: 3, t: "14:30", title: "TD + JK", kind: "internal" },
  { day: 3, t: "15:00", title: "Levi speech — Topanga Canyon, West Hills", kind: "personal" },

  { day: 4, t: "8:00", title: "Brainstorming / Quarterly Podcast Review", kind: "internal" },
  { day: 4, t: "9:00", title: "PODCAST HOLD — Jenn + Jacob", kind: "internal",
    prep: "Podcast = the optics-safe channel. Guests become warm contacts (Piontek was one). Who from the matchboard would make a good guest? Womble. Pratt. Gittisriboongul if the supe news confirms." },
  { day: 4, t: "13:00", title: "Jacob // Zen Educate target schools strategy", co: ["zen"], kind: "client",
    prep: "The matchboard was built for this hour. Zen's verified board: 1) Patrick Gittisriboongul — likely now Lynwood supe, SPED Solutions is literally in his roster interests; lead with $500K not $1M. 2) Allen Pratt — this week's ask: 'which rural co-ops should see this first?' 3) Iglesias waits behind TSL. 4) Piontek waits behind NVIDIA. 5) Vigil demoted — off-lane. Eric Brooks: HARD WAIT, he's carrying two asks already." },
  { day: 4, t: "14:00", title: "Upstart Weekly", co: ["upstart"], kind: "client" },
  { day: 4, t: "15:00", title: "Delivery appointment — Long Beach", kind: "personal" },
];

// ---------------- app ----------------
const DAYS = ["Mon 17", "Tue 18", "Wed 19", "Thu 20", "Fri 21"];
const $ = s => document.querySelector(s);
const LSW = "dodo-intern-v1"; // shared store with the trainer
let S = JSON.parse(localStorage.getItem(LSW) || "null") || { log: [], facts: {}, pairs: {}, globalRules: [], reasonCounts: {}, agree: 0, total: 0, seeded: true };
function save() { localStorage.setItem(LSW, JSON.stringify(S)); }

function poolMatch(name) {
  const n = name.toLowerCase();
  return POOL.find(p => p.name.toLowerCase() === n) || POOL.find(p => n.length > 5 && p.name.toLowerCase().includes(n.split(" ")[1] || "@@") && p.name.toLowerCase().includes(n.split(" ")[0]));
}
function contactIntel(name) {
  const p = poolMatch(name);
  if (!p) return `<span class="unknown">“${name}” isn’t in my files — after the meeting, give me one line on them.</span>`;
  const f = S.facts[p.name] || {};
  const bits = [];
  if (p.msgs) bits.push(`${p.msgs[0]}/${p.msgs[1]} msgs · ~${p.latencyH}h replies`);
  if (p.mentions) bits.push(`${p.mentions} mentions`);
  if (p.notes) bits.push(`your note: “${p.notes.slice(0, 60)}”`);
  const known = f.seedText ? `<div class="known">◆ ${f.seedText}</div>` : "";
  return `<b>${p.name}</b> — ${[p.role, p.org].filter(Boolean).join(", ")}${bits.length ? `<div class="intel">${bits.join(" · ")}</div>` : ""}${known}`;
}

let day = Math.min(4, Math.max(0, (new Date().getDay() + 6) % 7)); // Mon=0
const hp = new URLSearchParams(location.hash.slice(1));
if (hp.get("d") !== null && hp.get("d") !== undefined && hp.get("d") !== "") day = Math.min(4, Math.max(0, +hp.get("d")));
function renderTabs() {
  $("#tabs").innerHTML = DAYS.map((d, i) =>
    `<button class="tab ${i === day ? "on" : ""}" data-d="${i}">${d}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => { day = +b.dataset.d; render(); });
}

function render() {
  renderTabs();
  const evts = CAL.filter(e => e.day === day);
  const clientCount = evts.filter(e => e.kind === "client").length;
  const flagCount = evts.filter(e => e.flag).length;
  $("#daysum").innerHTML = `<b>${clientCount}</b> client meetings · <b>${flagCount}</b> goodwill flag${flagCount === 1 ? "" : "s"} · tap a meeting for the brief`;
  $("#list").innerHTML = evts.map((e, i) => {
    const captured = S.log.find(l => l.meeting === e.title);
    const chips = (e.co || []).map(c => `<span class="cochip" style="border-color:${CAL_COMPANIES[c].hue};color:${CAL_COMPANIES[c].hue}">${CAL_COMPANIES[c].name}</span>`).join("");
    return `<div class="evt k-${e.kind} ${e.flag ? "flagged" : ""}" data-i="${i}">
      <div class="evt-top"><span class="t">${e.t}</span><span class="title">${e.title}</span>${captured ? '<span class="done">✓ captured</span>' : ""}</div>
      ${chips ? `<div class="chiprow">${chips}</div>` : ""}
      ${e.flag ? `<div class="flagline">⚑ goodwill flag</div>` : ""}
      <div class="brief" id="brief-${i}"></div>
    </div>`;
  }).join("");
  document.querySelectorAll(".evt").forEach(el => el.onclick = () => openBrief(+el.dataset.i, el));
}

function openBrief(i, el) {
  const e = CAL.filter(x => x.day === day)[i];
  const b = el.querySelector(".brief");
  if (b.classList.contains("open")) { b.classList.remove("open"); b.innerHTML = ""; return; }
  document.querySelectorAll(".brief.open").forEach(x => { x.classList.remove("open"); x.innerHTML = ""; });
  const parts = [];
  if (e.contacts) parts.push(...e.contacts.map(c => `<div class="c-int">${contactIntel(c)}</div>`));
  if (e.prep) parts.push(`<div class="prep">${e.prep}</div>`);
  if (e.stale) parts.push(`<div class="stale">⚠ ${e.stale}</div>`);
  if (e.flag) parts.push(`<div class="flagbox">⚑ ${e.flag}</div>`);
  if (!parts.length) parts.push(`<div class="prep muted2">Nothing in the files for this one. If someone new matters, tell me after.</div>`);
  parts.push(`
    <div class="capture">
      <div class="cap-label">after the meeting — how'd it go?</div>
      <div class="cap-row">${[1, 2, 3, 4, 5].map(n => `<button class="score" data-n="${n}">${n}</button>`).join("")}</div>
      <div class="cap-why"><input placeholder="one line — what happened, who came up… (talk or type)"><button class="mic2">🎙</button></div>
    </div>`);
  b.innerHTML = parts.join("");
  b.classList.add("open");
  b.querySelectorAll(".score").forEach(btn => btn.onclick = ev => {
    ev.stopPropagation();
    b.querySelectorAll(".score").forEach(x => x.classList.remove("sel"));
    btn.classList.add("sel");
  });
  const input = b.querySelector("input");
  input.onclick = ev => ev.stopPropagation();
  input.onkeydown = ev => {
    if (ev.key === "Enter") { captureMeeting(e, b); ev.stopPropagation(); }
  };
  const mic = b.querySelector(".mic2");
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    mic.onclick = ev => {
      ev.stopPropagation();
      const rec = new SR(); rec.lang = "en-US";
      mic.classList.add("rec");
      rec.onresult = r => { input.value = r.results[0][0].transcript; captureMeeting(e, b); };
      rec.onend = () => mic.classList.remove("rec");
      rec.start();
    };
  } else mic.style.display = "none";
}

function captureMeeting(e, b) {
  const score = b.querySelector(".score.sel")?.dataset.n || null;
  const why = b.querySelector("input").value.trim() || null;
  if (!score && !why) return;
  S.log.push({ t: new Date().toISOString(), type: "meeting_capture", meeting: e.title, day: DAYS[day],
    companies: (e.co || []).map(c => CAL_COMPANIES[c].name), contacts: e.contacts || [], score, why });
  save();
  b.innerHTML = `<div class="prep" style="color:var(--accent)">✓ Captured${score ? " — " + score + "/5" : ""}${why ? " — “" + why + "”" : ""}. It's in the training log.</div>`;
  setTimeout(render, 1200);
}

render();
if (hp.get("open") !== null && hp.get("open") !== undefined && hp.get("open") !== "") {
  const idx = +hp.get("open");
  const el = document.querySelectorAll(".evt")[idx];
  if (el) openBrief(idx, el);
}
