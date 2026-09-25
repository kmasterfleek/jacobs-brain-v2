// This-week demo: calendar transcribed from Jacob's Google Calendar screenshot
// (week of Sep 28 – Oct 2, 2026). Replace with ICS import when available.
// The intern preps each meeting from the files + learned judgments, warns on
// ask-stacking, and captures a 10-second outcome after — same training log.

const WEEK_START = "2026-09-28"; // Monday of the calendar below — update when a new week is loaded

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
  learningcommons: { name: "Learning Commons", hue: "#c9a0e8" },
};

// day: 0=Mon..4=Fri · kind: client|intro|internal|personal|task|hold
// Personal finance entries on the source calendar are deliberately not transcribed.
const CAL = [
  { day: 0, t: "8:00", title: "LOOK at each company's hit list — make a targeted list", kind: "task",
    prep: "Same Monday ritual as last week. The matchboard is the pre-verified version of this list — start from it, then add what last week's meetings taught you." },
  { day: 0, t: "8:00", title: "Message to DODO network (drafting block)", kind: "task" },
  { day: 0, t: "8:00", title: "Sam Whita… (Microsoft Teams)", contacts: ["Sam Whitaker"], kind: "intro",
    prep: "Name is cut off on the calendar — confirm who this is. If it's Sam W. from last week's internal block, it's a team check-in, not an ask." },
  { day: 0, t: "8:00", title: "Bobby Koontz + Third Space Learning", co: ["tsl"], contacts: ["Bobby Koontz"], kind: "client",
    prep: "Bobby Koontz isn't in the files or the capsule yet. After: one line — role, district, and whether he signs or routes." },
  { day: 0, t: "8:30", title: "Bobby Koo… · Jacob - Mi… (overlapping holds)", contacts: ["Bobby Koontz"], kind: "hold" },
  { day: 0, t: "9:00", title: "Tom x Jacob", kind: "internal" },
  { day: 0, t: "9:30", title: "NREA pre-event social", kind: "intro",
    prep: "National Rural Education Association — this is Allen Pratt's world (roster: former ED, All Things Rural, 'most connected person'). Pure give tonight: be seen, make introductions. The ask that works with him later is the map — 'which rural co-ops should see this first?' — not a meeting." ,
    flag: "Social event, not a pitch room. No asks." },
  { day: 0, t: "10:00", title: "The Kindezi Schools + Journify", kind: "client",
    prep: "Kindezi is a small charter network (Atlanta) — network-level signing, fast decisions. Attempt history question for the graph: what have they already tried for this problem?" },
  { day: 0, t: "10:15", title: "Learning Commons 15 Min — An…", co: ["learningcommons"], kind: "intro" },
  { day: 0, t: "10:30", title: "Ira Gluck / Learning Commons <> School Harbor", co: ["learningcommons"], contacts: ["Ira Gluck"], kind: "client",
    prep: "Ira Gluck: in the capsule (10 mentions) — a known relationship. Learning Commons is all over this week (7 short calls + Ira/Tony prep Thu + continued Fri) — treat the week as one campaign, and capture one line after each call." },
  { day: 0, t: "11:00", title: "Learning Commons 15 Min — Brooke Powers", co: ["learningcommons"], contacts: ["Brooke Powers"], kind: "intro" },
  { day: 0, t: "11:15", title: "15 min quick check-in — Bryan Dickens", contacts: ["Bryan Dickens"], kind: "intro" },
  { day: 0, t: "11:30", title: "30 MIN Intro — Chief DODO Call — Mike McKenna", contacts: ["Mike McKenna"], kind: "intro" },
  { day: 0, t: "12:00", title: "Knowt + Jacob Sync", co: ["knowt"], kind: "client" },
  { day: 0, t: "12:30", title: "SAM Labs X DODO", co: ["samlabs"], kind: "client",
    prep: "Follow-through from Oregon DOE: did 'which three districts should pilot this?' get an answer? If yes, those three are this week's work." },
  { day: 0, t: "13:15", title: "Learning Commons 15 Min — Alexis Jamin", co: ["learningcommons"], contacts: ["Alexis Jamin"], kind: "intro" },
  { day: 0, t: "13:30", title: "Learning Commons 15 Min — Kate Thomas", co: ["learningcommons"], contacts: ["Kate Thomas"], kind: "intro" },
  { day: 0, t: "13:45", title: "15 min quick check-in — Tyler Borek", contacts: ["Tyler Borek"], kind: "intro" },
  { day: 0, t: "14:00", title: "15 min quick check-in — Christopher Holt", contacts: ["Christopher Holt"], kind: "intro",
    prep: "Roster has a Christopher Holt at Hillsborough County Public Schools (FL) — confirm it's the same person. Hillsborough is one of the largest districts in the country." },
  { day: 0, t: "14:15", title: "Connect with Jacob Kantor", kind: "intro",
    prep: "No name on the invite — capture who it was after." },

  { day: 1, t: "8:00", title: "Pearl + Mike Afdahl (Northwest Georgia RESA)", co: ["pearl"], contacts: ["Mike Afdahl"], kind: "client",
    prep: "RESA = regional service agency: the pooled-demand shape (same as Southwest Georgia RESA last time). Pickens County is on Thursday with Pearl too — if Pickens sits in this RESA's footprint, today is the lever for Thursday. Confirm." },
  { day: 1, t: "8:30", title: "TSL + DODO Weekly", co: ["tsl"], kind: "client",
    prep: "Two TSL rooms this week: Bobby Koontz (Mon) and Feaster Charter / Chula Vista (Wed). As of the August matchboard: Iglesias ask in flight, Pake needed his new district confirmed, Piontek deferred behind NVIDIA — update those." },
  { day: 1, t: "9:00", title: "Personal appointment", kind: "personal" },
  { day: 1, t: "10:00", title: "AI Developer Tools — Intro Call", kind: "intro" },
  { day: 1, t: "10:00", title: "NovoDia + Learning Commons", co: ["learningcommons"], kind: "client" },
  { day: 1, t: "10:30", title: "DODO x Mission Telecom Kick", co: ["telecom"], kind: "client",
    prep: "Still open from kickoff: which pain tags does Telecom actually solve? (devices & infrastructure is the likely lane.) Get it in writing today so matching can start." },
  { day: 1, t: "11:00", title: "30 MIN Chief DODO Call — Guest of Marc Isseks & Brian Messinger", contacts: ["Marc Isseks", "Brian Messinger"], kind: "intro",
    prep: "Marc Isseks: in the capsule (7 mentions); roster ties him to New York City Public Schools. A guest brought by Marc is a referral — say thank-you to Marc after, whatever happens." },
  { day: 1, t: "12:00", title: "Learning Commons 15 Min — Deniz Gulbaharli", co: ["learningcommons"], contacts: ["Deniz Gulbaharli"], kind: "intro" },
  { day: 1, t: "12:15", title: "30 MIN Intro — Chief DODO Call — Scott Page", contacts: ["Scott Page"], kind: "intro",
    prep: "Scott Page: 3 mentions in the capsule — you've talked before. Check the sky for what about." },
  { day: 1, t: "12:45", title: "15 min quick check-in — Casey Barneson", contacts: ["Casey Barneson"], kind: "intro" },
  { day: 1, t: "13:00", title: "Pearl x JK K12 Standing", co: ["pearl"], kind: "client",
    prep: "Three Pearl touchpoints this week (this, NW Georgia RESA, Pickens County). Use the standing to agree which Georgia door matters most." },
  { day: 1, t: "13:30", title: "30 MIN Intro — Chief DODO Call — Rudy Escobar", contacts: ["Rudy Escobar"], kind: "intro",
    prep: "Rudy Escobar: 3 mentions in the capsule; roster ties him to Stanislaus County Office of Education (CA). County office = router + aggregator — the ask is 'which districts in your county should see this?'" },
  { day: 1, t: "14:30", title: "30 MIN Intro — Chief DODO Call — Mara Steiu", contacts: ["Mara Steiu"], kind: "intro" },

  { day: 2, t: "7:00", title: "Driving K-12 Innovation (Zoom)", kind: "hold" },
  { day: 2, t: "8:00", title: "OUTREACH block", kind: "task",
    prep: "Before sending anything: this week's intros are a big new-names week. Outreach goes to people with charge left — nobody who's already in a room with you this week." },
  { day: 2, t: "10:00", title: "Feaster Charter (Chula Vista USD) + Team Third Space Learning", co: ["tsl"], kind: "client",
    prep: "Charter inside Chula Vista USD — single school, fast yes/no. If it lands, it's the proof point for the district above it." },
  { day: 2, t: "11:00", title: "15 min quick check-in — Alyssa Sabbatino", contacts: ["Alyssa Sabbatino"], kind: "intro",
    prep: "Roster has an Alyssa Sabbatino (NY) with no role on file — fill it in after." },
  { day: 2, t: "12:00", title: "Learning Commons 15 Min — Courtney Cintron", co: ["learningcommons"], contacts: ["Courtney Cintron"], kind: "intro" },
  { day: 2, t: "12:15", title: "[Chief DODO] Jacob Kantor — Integrate This! Podcast", kind: "internal",
    prep: "Podcast = the optics-safe channel. Guests become warm contacts." },
  { day: 2, t: "12:15", title: "30 MIN Intro — Chief DODO C…", kind: "intro" },
  { day: 2, t: "12:45", title: "30 MIN Intro — Chief DODO C…", kind: "intro" },

  { day: 3, t: "8:00", title: "OUTREACH block", kind: "task" },
  { day: 3, t: "9:00", title: "HOLD: Nathan — Moorpark Donuts", kind: "hold" },
  { day: 3, t: "10:00", title: "Ira + Tony + Jacob Prep", contacts: ["Ira Gluck"], kind: "internal",
    prep: "Prep for Friday's continued session. Bring the one-liners from this week's Learning Commons calls — that's the input." },
  { day: 3, t: "10:30", title: "Pickens County + Team Pearl", co: ["pearl"], kind: "client",
    prep: "Tuesday's RESA call should tell you whether Pickens is inside a pooled-demand footprint. Walk in knowing." },
  { day: 3, t: "11:00", title: "Upstart Weekly", co: ["upstart"], kind: "client" },
  { day: 3, t: "12:00", title: "30 Minute Meeting with Nishitha Viswanathan", contacts: ["Nishitha Viswanathan"], kind: "intro" },
  { day: 3, t: "13:00", title: "Crimson Weekly Call", co: ["crimson"], kind: "client" },
  { day: 3, t: "15:00", title: "Levi speech", kind: "personal" },

  { day: 4, t: "8:00", title: "Brainstorming / Quarterly Podcast Review", kind: "internal" },
  { day: 4, t: "8:15", title: "Jacob + Ira + Tony — Continued (Learning Commons)", co: ["learningcommons"], contacts: ["Ira Gluck"], kind: "internal" },
  { day: 4, t: "9:00", title: "PODCAST HOLD — Jenn + Jacob", kind: "internal",
    prep: "Guest ideas from the matchboard: Womble, Pratt (fresh off NREA Monday)." },
  { day: 4, t: "9:00", title: "PODCAST HOLD: Jenn & Jacob + Mark + Verkada", kind: "internal",
    prep: "A vendor on the podcast: keep the conversation on what districts need, not the product — that's what keeps the channel optics-safe.",
    flag: "No-sales-optics rule: the episode can't read as an ad." },
  { day: 4, t: "11:30", title: "busy", kind: "personal" },
  { day: 4, t: "13:30", title: "J+J+M", kind: "internal" },
];

// ---------------- app ----------------
const DAYS = [0, 1, 2, 3, 4].map(i => { const d = new Date(new Date(WEEK_START + "T12:00:00").getTime() + i * 864e5);
  return d.toLocaleDateString("en-US", { weekday: "short" }) + " " + d.getDate(); });
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
