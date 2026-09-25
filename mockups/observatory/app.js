// The Observatory: Jacob's capsule as a navigable sky.
// People = stars (semantic PCA position, size = mentions). Fragments = dust.
// Search lights fragments and the people they were said to.

const $ = (s) => document.querySelector(s);
const sky = $("#sky"), ctx = sky.getContext("2d");
const DPR = window.devicePixelRatio || 1;

// name normalization (mirror of build script)
const norm = (n) => n.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z\s.'-]/g, "").replace(/\b(phd|edd|med|mba|dr|jr|sr|ii|iii|he|him|his|she|her)\b\.?/g, "").replace(/\s+/g, " ").trim();
const personByKey = new Map(PEOPLE.map(p => [norm(p.name), p]));
const dustIndexById = new Map(DUST.id.map((id, i) => [id, i]));

// view transform
let T = { k: 1, tx: 0, ty: 0 };
let W, H, CX, CY, R;
function resize() {
  W = innerWidth; H = innerHeight;
  sky.width = W * DPR; sky.height = H * DPR;
  sky.style.width = W + "px"; sky.style.height = H + "px";
  CX = W / 2; CY = H / 2 - 10; R = Math.min(W, H) * 0.42;
  renderDustLayer();
}
const toScreen = (nx, ny) => [CX + (nx * R) * T.k + T.tx, CY + (ny * R) * T.k + T.ty];

// static dust layer (offscreen, redrawn on zoom end)
const dustCanvas = document.createElement("canvas");
function renderDustLayer() {
  dustCanvas.width = W * DPR; dustCanvas.height = H * DPR;
  const d = dustCanvas.getContext("2d");
  d.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (let i = 0; i < DUST.x.length; i++) {
    const [x, y] = toScreen(DUST.x[i] / 500, DUST.y[i] / 500);
    if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
    d.fillStyle = "rgba(200,198,185,0.32)";
    d.fillRect(x, y, 1, 1);
  }
}

// state
let results = null;          // [{score,id,date,text,addressed,url}]
let hitByPerson = null;      // Map personIdx -> count
let litPoints = null;        // [{x,y,score,personIdx}]
let selected = null;         // person object
let hover = null;
let t = 0;
let focusPpl = null;         // Set of person indices from a focused meeting
let focusDust = null;        // [[nx,ny]] fragments addressed to focused attendees

function applySearch(list, label) {
  results = list;
  hitByPerson = new Map();
  litPoints = [];
  for (const r of list) {
    const di = dustIndexById.get(r.id);
    if (di === undefined) continue;
    const pi = DUST.pi[di];
    litPoints.push({ nx: DUST.x[di] / 500, ny: DUST.y[di] / 500, score: r.score, pi, r });
    if (pi >= 0) hitByPerson.set(pi, (hitByPerson.get(pi) || 0) + 1);
  }
  drawTimeline();
  renderSearchPanel(label);
  $("#clear").style.display = "inline-block";
  $("#status").innerHTML = `<b>${list.length}</b> fragments lit · <b>${hitByPerson.size}</b> people in the answer`;
}
function clearSearch() {
  results = null; hitByPerson = null; litPoints = null;
  $("#q").value = ""; $("#clear").style.display = "none"; $("#status").innerHTML = "";
  drawTimeline(); closePanel();
}

// ---------- draw ----------
function starR(n) { return 2 + Math.log2(1 + n) * 1.15; }
function draw() {
  t += 0.016;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(dustCanvas, 0, 0, W, H);

  // fragments addressed to the focused meeting's attendees — their dust glows amber
  if (focusDust) {
    ctx.fillStyle = "rgba(217,164,65,0.7)";
    for (const d of focusDust) {
      const [x, y] = toScreen(d[0], d[1]);
      if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  // lines from lit fragments to their people
  if (litPoints) {
    ctx.lineWidth = 0.6;
    for (const p of litPoints) {
      if (p.pi < 0) continue;
      const per = PEOPLE[p.pi];
      const [x1, y1] = toScreen(p.nx, p.ny), [x2, y2] = toScreen(per.x, per.y);
      ctx.strokeStyle = "rgba(85,177,142,0.14)";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    for (const p of litPoints) {
      const [x, y] = toScreen(p.nx, p.ny);
      const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
      g.addColorStop(0, "rgba(140,230,195,0.95)"); g.addColorStop(1, "rgba(140,230,195,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(230,255,244,0.95)";
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill();
    }
  }

  drawDustHover();

  // people stars
  ctx.font = "11px system-ui, sans-serif";
  for (const p of PEOPLE) {
    const [x, y] = toScreen(p.x, p.y);
    if (x < -60 || x > W + 60 || y < -30 || y > H + 30) continue;
    const hits = hitByPerson ? hitByPerson.get(p.i) || 0 : 0;
    const foc = focusPpl ? focusPpl.has(p.i) : false;
    let dim = hitByPerson && !hits ? 0.3 : 1;
    if (focusPpl) dim = foc ? 1 : Math.min(dim, 0.3);
    const r = starR(p.n) * (1 + 0.06 * Math.sin(t * 1.5 + p.i));
    const glowR = r * 4 + (hits ? 10 : 0);
    const warm = hits ? "85,177,142" : "255,246,224";
    const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g.addColorStop(0, `rgba(${warm},${0.75 * dim})`);
    g.addColorStop(0.4, `rgba(${warm},${0.18 * dim})`);
    g.addColorStop(1, `rgba(${warm},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, glowR, 0, 7); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.92 * dim})`;
    ctx.beginPath(); ctx.arc(x, y, Math.min(r, 5), 0, 7); ctx.fill();
    if (p.cal.length || calPplSet.has(p.i)) { // on this week's calendar (matched or Jacob-added)
      ctx.strokeStyle = `rgba(217,164,65,${0.85 * dim})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, Math.min(r, 5) + 4, 0, 7); ctx.stroke();
    }
    if (foc) { // attendee of the focused meeting — pulsing amber beacon
      const pr = Math.min(r, 5) + 8 + 2 * Math.sin(t * 2.5 + p.i);
      ctx.strokeStyle = "rgba(217,164,65,0.9)"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(x, y, pr, 0, 7); ctx.stroke();
    }
    const showLabel = p.n >= 40 || hits || foc || hover === p.i || (selected && selected.i === p.i) || T.k > 2;
    if (showLabel) {
      ctx.fillStyle = hits ? "rgba(155,225,195,.95)" : foc ? "rgba(235,197,122,.95)" : `rgba(195,194,183,${0.8 * dim})`;
      ctx.fillText(p.name + (hits ? " · " + hits : ""), x + 8, y + 3.5);
    }
  }
  drawRegions(); // captions on top, haloed so star names don't swallow them
  requestAnimationFrame(draw);
}

// ---------- timeline ----------
const tl = $("#tl"), tctx = tl.getContext("2d");
function drawTimeline() {
  const w = tl.clientWidth * DPR, h = 52 * DPR;
  tl.width = w; tl.height = h;
  const totals = new Array(YEARS).fill(0), hits = new Array(YEARS).fill(0);
  for (let i = 0; i < DUST.yr.length; i++) totals[DUST.yr[i]]++;
  if (results) for (const r of results) { const y = +r.date.slice(0, 4) - YEAR0; if (y >= 0 && y < YEARS) hits[y]++; }
  const max = Math.sqrt(Math.max(...totals));
  const bw = w / YEARS;
  tctx.font = `${9 * DPR}px system-ui`;
  for (let y = 0; y < YEARS; y++) {
    const bh = (Math.sqrt(totals[y]) / max) * (h - 14 * DPR);
    tctx.fillStyle = "rgba(255,255,255,0.13)";
    tctx.fillRect(y * bw + 2, h - 12 * DPR - bh, bw - 4, bh);
    if (results && hits[y]) {
      const hh = Math.max(2, (Math.sqrt(hits[y]) / Math.sqrt(Math.max(...hits))) * (h - 14 * DPR));
      tctx.fillStyle = "rgba(85,177,142,0.9)";
      tctx.fillRect(y * bw + 2, h - 12 * DPR - hh, bw - 4, hh);
    }
    tctx.fillStyle = "rgba(126,133,125,.9)";
    tctx.fillText("'" + String(YEAR0 + y).slice(2), y * bw + bw / 2 - 5 * DPR, h - 2 * DPR);
  }
}

// ---------- panel ----------
const panel = $("#panel");
function closePanel() { panel.classList.remove("show"); selected = null; $("#timeline").classList.add("wide"); }
window.closePanel = closePanel;

function spark(years) {
  let s = "";
  const max = Math.max(...Object.values(years), 1);
  for (let y = 0; y < YEARS; y++) {
    const v = years[YEAR0 + y] || 0;
    const h = Math.round((v / max) * 26);
    s += `<span style="display:inline-block;width:14px;height:28px;position:relative"><span style="position:absolute;bottom:0;left:2px;width:10px;height:${Math.max(1, h)}px;background:${v ? "rgba(85,177,142,.8)" : "rgba(255,255,255,.1)"};border-radius:1px"></span></span>`;
  }
  return `<div class="spark">${s}<div class="sub">'13 ————— mentions by year ————— '26</div></div>`;
}

async function openPerson(p) {
  selected = p;
  panel.classList.add("show"); $("#timeline").classList.remove("wide");
  panel.innerHTML = `<button class="x" onclick="closePanel()">×</button>
    <h2>${p.name}</h2>
    ${p.role ? `<div class="sub">${p.role}</div>` : `<div class="sub">not yet in the roster — the capsule knows them anyway</div>`}
    <div class="stat-row"><span><b>${p.n}</b> mentions</span><span>${p.first.slice(0, 7)} → ${p.last.slice(0, 7)}</span>
    ${p.msgs ? `<span><b>${p.msgs[0]}/${p.msgs[1]}</b> msgs${p.lat != null ? ` · ~${p.lat}h` : ""}</span>` : ""}</div>
    ${spark(p.years)}
    ${p.note ? `<div class="note">◆ ${p.note}</div>` : ""}
    ${calListFor(p).length ? `<div class="calrow">⚑ this week: ${calListFor(p).map(esc).join(" · ")}</div>` : ""}
    <div class="sect">What Jacob has said to them</div>
    <div id="p-frags"><div class="sub">loading…</div></div>`;
  const res = await fetch(`/api/person?name=${encodeURIComponent(p.name.split(" ").slice(0, 2).join(" "))}`).then(r => r.json());
  $("#p-frags").innerHTML = res.slice(0, 12).map(f =>
    `<div class="frag"><span class="d">${f.date}</span> ${esc(f.text.slice(0, 160))} ${f.url ? `<a href="${f.url}" target="_blank">↗</a>` : ""}</div>`).join("") || `<div class="sub">nothing on file</div>`;
}

function renderSearchPanel(label) {
  selected = null;
  panel.classList.add("show"); $("#timeline").classList.remove("wide");
  const ranked = [...hitByPerson.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  panel.innerHTML = `<button class="x" onclick="closePanel()">×</button>
    <h2>${esc(label || "“" + $("#q").value + "”")}</h2>
    <div class="sub">what the capsule holds on this</div>
    ${ranked.length ? `<div class="sect">Who this topic belongs to</div>` : ""}
    ${ranked.map(([pi, n]) => `<div class="p-hit" data-pi="${pi}"><span>${PEOPLE[pi].name}${PEOPLE[pi].cal.length || calPplSet.has(pi) ? " ⚑" : ""}</span><b>${n}</b></div>`).join("")}
    <div class="sect">Strongest fragments</div>
    ${results.slice(0, 12).map(r => `<div class="frag hit"><span class="d">${r.date}${r.addressed && !SELF.test(r.addressed) ? " · → " + esc(r.addressed) : ""}</span> ${esc(r.text.slice(0, 170))} ${r.url ? `<a href="${r.url}" target="_blank">↗</a>` : ""}</div>`).join("")}`;
  panel.querySelectorAll(".p-hit").forEach(el => el.onclick = () => openPerson(PEOPLE[+el.dataset.pi]));
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const SELF = /^jacob kantor/i; // replies in his own threads aren't "said to" anyone

// ---------- search ----------
const EXAMPLES = ["special education staffing", "AI in the classroom", "rural schools", "math tutoring", "podcast guests", "conference speaking"];
$("#chips").innerHTML = EXAMPLES.map(e => `<span class="chip">${e}</span>`).join("");
document.querySelectorAll(".chip").forEach(c => c.onclick = () => { $("#q").value = c.textContent; doSearch(); });
async function doSearch() {
  const q = $("#q").value.trim();
  if (!q) return;
  $("#status").innerHTML = "asking the capsule…";
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&k=80`).then(r => r.json());
  applySearch(res);
}
$("#go").onclick = doSearch;
$("#q").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
$("#clear").onclick = clearSearch;

// ---------- interaction: hover, click, pan, zoom ----------
function hitPerson(mx, my) {
  let best = null, bd = 14;
  for (const p of PEOPLE) {
    const [x, y] = toScreen(p.x, p.y);
    const d = Math.hypot(x - mx, y - my);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
let dragging = false, moved = false, lx = 0, ly = 0;
sky.addEventListener("mousedown", (e) => { dragging = true; moved = false; lx = e.clientX; ly = e.clientY; });
window.addEventListener("mouseup", () => { dragging = false; });
sky.addEventListener("mousemove", (e) => {
  if (dragging) {
    const dx = e.clientX - lx, dy = e.clientY - ly;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    T.tx += dx; T.ty += dy; lx = e.clientX; ly = e.clientY;
    renderDustLayer();
    return;
  }
  const p = hitPerson(e.clientX, e.clientY);
  hover = p ? p.i : null;
  hoverRegion = p ? null : hitRegion(e.clientX, e.clientY);
  const di = p || hoverRegion ? -1 : hitDust(e.clientX, e.clientY);
  const newDust = di !== hoverDust; hoverDust = di;
  sky.style.cursor = p || hoverRegion || di >= 0 ? "pointer" : "default";
  const tip = $("#tip");
  if (hoverRegion) regionTip(hoverRegion, e, tip);
  else if (di >= 0) { if (newDust) dustTip(di, e, tip); else { tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + "px"; tip.style.top = e.clientY + 12 + "px"; } }
  else if (p) {
    tip.style.display = "block";
    tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + "px";
    tip.style.top = e.clientY + 12 + "px";
    tip.innerHTML = `<strong>${p.name}</strong> — ${p.n} mentions<br><span class="muted">${p.role || "not in roster"}${p.cal.length || calPplSet.has(p.i) ? " · ⚑ on this week's calendar" : ""}</span>`;
  } else tip.style.display = "none";
});
sky.addEventListener("click", (e) => {
  if (moved) return;
  const p = hitPerson(e.clientX, e.clientY);
  if (p) return openPerson(p);
  const r = hitRegion(e.clientX, e.clientY);
  if (r) return topicSearch(r);
  const di = hitDust(e.clientX, e.clientY);
  if (di >= 0) openFragment(di);
});
sky.addEventListener("wheel", (e) => {
  e.preventDefault();
  const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  const nk = Math.max(0.5, Math.min(8, T.k * f));
  const scale = nk / T.k;
  T.tx = (T.tx - (e.clientX - CX)) * scale + (e.clientX - CX);
  T.ty = (T.ty - (e.clientY - CY)) * scale + (e.clientY - CY);
  T.k = nk;
  renderDustLayer();
}, { passive: false });

// ---------- this week's calendar ----------
const calEl = $("#cal"), calBtn = $("#calbtn");
// day labels come from the calendar's week start, so a new week's calendar just works
const WK0 = new Date(WEEK_START + "T12:00:00");
const wkDay = (i) => new Date(WK0.getTime() + i * 864e5);
const CAL_DAYS = [0, 1, 2, 3, 4].map(i => wkDay(i).toLocaleDateString("en-US", { weekday: "short", day: "numeric" }).replace(/(\d+) (\w+)/, "$2 $1"));
const WEEK_LABEL = wkDay(0).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + "–" +
  (wkDay(4).getMonth() === wkDay(0).getMonth() ? wkDay(4).getDate() : wkDay(4).toLocaleDateString("en-US", { month: "short", day: "numeric" }));
let calOpen = false, openMtg = null;
const todayIdx = Math.floor((Date.now() - WK0.getTime() + 12 * 36e5) / 864e5);
let calDay = todayIdx >= 0 && todayIdx <= 4 ? todayIdx : 0; // today if it's in the loaded week, else Monday

// Jacob's manual attendee fixes — for people the name-matching missed (misspellings,
// title-only mentions). Stored as normalized names so they survive data.js rebuilds.
const LSCAL = "dodo-observatory-cal-v1";
let calFix = JSON.parse(localStorage.getItem(LSCAL) || "{}"); // meetingKey -> [norm names]
const mkey = (m) => m.day + "|" + m.t + "|" + m.title;
const saveCalFix = () => localStorage.setItem(LSCAL, JSON.stringify(calFix));
const manualPpl = (m) => (calFix[mkey(m)] || []).map(n => personByKey.get(n)).filter(Boolean).map(p => p.i);
const mppl = (m) => [...new Set([...m.ppl, ...manualPpl(m)])];
function addFix(m, pi) {
  const arr = calFix[mkey(m)] || (calFix[mkey(m)] = []);
  const key = norm(PEOPLE[pi].name);
  if (!arr.includes(key)) arr.push(key);
  saveCalFix(); rebuildCalSet();
}
function removeFix(m, pi) {
  const key = norm(PEOPLE[pi].name);
  calFix[mkey(m)] = (calFix[mkey(m)] || []).filter(n => n !== key);
  if (!calFix[mkey(m)].length) delete calFix[mkey(m)];
  saveCalFix(); rebuildCalSet();
}

// every star on the week's calendar (auto-matched or Jacob-added) — drives the amber ring
let calPplSet = new Set();
function rebuildCalSet() {
  calPplSet = new Set();
  for (const m of MEETINGS) for (const pi of mppl(m)) calPplSet.add(pi);
}
rebuildCalSet();
const CAL_D = ["Mon", "Tue", "Wed", "Thu", "Fri"];
function calListFor(p) {
  const rows = [...p.cal];
  for (const m of MEETINGS) if (manualPpl(m).includes(p.i)) rows.push(`${CAL_D[m.day]} ${m.t} — ${m.title}`);
  return rows;
}

// loose star lookup: substring first, then word-prefix, then 3-letter prefix (catches misspellings)
function starMatches(qraw, excl) {
  const q = norm(qraw);
  if (q.length < 2) return [];
  const qt = q.split(" ").filter(Boolean);
  const scored = [];
  for (const p of PEOPLE) {
    if (excl.has(p.i)) continue;
    const k = norm(p.name), kt = k.split(" ");
    let s = 0;
    if (k.includes(q)) s = 3;
    else if (qt.every(t => kt.some(w => w.startsWith(t)))) s = 2;
    else if (qt.some(t => t.length >= 3 && kt.some(w => w.slice(0, 3) === t.slice(0, 3)))) s = 1;
    if (s) scored.push([s, p]);
  }
  return scored.sort((a, b) => b[0] - a[0] || b[1].n - a[1].n).slice(0, 6).map(x => x[1]);
}

function setMeetingFocus(m) {
  const ppl = mppl(m);
  focusPpl = new Set(ppl);
  focusDust = [];
  if (focusPpl.size) for (let i = 0; i < DUST.pi.length; i++)
    if (focusPpl.has(DUST.pi[i])) focusDust.push([DUST.x[i] / 500, DUST.y[i] / 500]);
  $("#status").innerHTML = ppl.length
    ? `⚑ <b>${esc(m.title.slice(0, 56))}</b> · <b>${ppl.length}</b> in the sky · ${focusDust.length} fragments glowing amber`
    : `⚑ <b>${esc(m.title.slice(0, 56))}</b> · no one from this meeting is in the sky yet — add them below or guess the topic`;
}
function clearMeetingFocus() {
  focusPpl = null; focusDust = null;
  if (!results) $("#status").innerHTML = "";
}

const contactIsStar = (c, ppl) => {
  const ck = norm(c), cf = ck.split(" ")[0], cl = ck.split(" ").pop();
  return ppl.some(pi => { const k = norm(PEOPLE[pi].name); return k === ck || (k.split(" ")[0] === cf && k.includes(cl)); });
};

function renderCal() {
  const list = MEETINGS.map((m, i) => ({ m, i })).filter(x => x.m.day === calDay);
  calEl.innerHTML = `<button class="x" onclick="toggleCal(false)">×</button>
    <h3>⚑ This week · ${WEEK_LABEL}</h3>
    <div class="daytabs">${CAL_DAYS.map((d, i) => `<button class="daytab ${i === calDay ? "on" : ""}" data-d="${i}">${d}</button>`).join("")}</div>
    <div class="calhint">click a meeting — anyone from it who lives in the sky lights up amber. guess what it's about to light the fragments.</div>
    ${list.map(({ m, i }) => {
      const manual = manualPpl(m), all = mppl(m);
      return `
      <div class="mtg ${openMtg === i ? "open" : ""}" data-i="${i}">
        <div class="head"><span class="t">${m.t}</span><span class="title">${esc(m.title)}${m.co.map(c => `<span class="dot" style="background:${c.hue}" title="${c.name}"></span>`).join("")}</span>${all.length ? `<span class="insky">✦ ${all.length}</span>` : ""}</div>
        <div class="body">
          ${m.prep ? `<div class="prep">◆ ${esc(m.prep)}</div>` : ""}
          ${m.flag ? `<div class="mflag">⚠ ${esc(m.flag)}</div>` : ""}
          ${m.stale ? `<div class="mflag">✎ ${esc(m.stale)}</div>` : ""}
          ${all.length || m.contacts.length ? `<div class="who">
            ${m.ppl.map(pi => `<span class="star-chip" data-pi="${pi}">✦ ${esc(PEOPLE[pi].name)}</span>`).join("")}
            ${manual.map(pi => `<span class="star-chip" data-pi="${pi}" title="added by Jacob">✦ ${esc(PEOPLE[pi].name)}<span class="rm" data-rm="${pi}">×</span></span>`).join("")}
            ${m.contacts.filter(c => !contactIsStar(c, all)).map(c => `<span class="nostar">${esc(c)} — not in the sky</span>`).join("")}
          </div>` : ""}
          <div class="addwho"><input placeholder="＋ add someone the matcher missed… (finds misspellings)"><div class="sugg"></div></div>
          <div class="guess"><input placeholder="guess the topic… e.g. AI in rural schools"><button>Light the sky</button></div>
        </div>
      </div>`; }).join("")}`;
  calEl.querySelectorAll(".daytab").forEach(b => b.onclick = () => { calDay = +b.dataset.d; openMtg = null; clearMeetingFocus(); renderCal(); });
  calEl.querySelectorAll(".mtg").forEach(el => {
    const i = +el.dataset.i, m = MEETINGS[i];
    el.querySelector(".head").onclick = () => {
      if (openMtg === i) { openMtg = null; clearMeetingFocus(); }
      else { openMtg = i; setMeetingFocus(m); }
      renderCal();
    };
    el.querySelectorAll(".star-chip").forEach(ch => ch.onclick = (e) => {
      e.stopPropagation();
      if (e.target.dataset.rm != null) {
        removeFix(m, +e.target.dataset.rm);
        if (openMtg === i) setMeetingFocus(m);
        renderCal();
      } else openPerson(PEOPLE[+ch.dataset.pi]);
    });
    const aw = el.querySelector(".addwho input"), sg = el.querySelector(".addwho .sugg");
    aw.onclick = (e) => e.stopPropagation();
    aw.oninput = () => {
      const hits = starMatches(aw.value, new Set(mppl(m)));
      if (!aw.value.trim()) { sg.style.display = "none"; return; }
      sg.innerHTML = hits.length
        ? hits.map(p => `<div data-add="${p.i}"><span>✦ ${esc(p.name)}</span><span class="m">${p.n} mentions${p.role ? " · " + esc(p.role.split(",")[0]) : ""}</span></div>`).join("")
        : `<div class="none">no star by that name — they may not be in the capsule's top 160 (low LinkedIn ≠ low value)</div>`;
      sg.style.display = "block";
      sg.querySelectorAll("[data-add]").forEach(d => d.onclick = (e) => {
        e.stopPropagation();
        addFix(m, +d.dataset.add);
        if (openMtg !== i) openMtg = i;
        setMeetingFocus(m);
        renderCal();
      });
    };
    const inp = el.querySelector(".guess input"), btn = el.querySelector(".guess button");
    const go = () => { const v = inp.value.trim(); if (!v) return; $("#q").value = v; doSearch(); };
    btn.onclick = (e) => { e.stopPropagation(); go(); };
    inp.onkeydown = (e) => { if (e.key === "Enter") go(); };
  });
}
function toggleCal(v) {
  calOpen = v === undefined ? !calOpen : v;
  calEl.classList.toggle("show", calOpen);
  calBtn.classList.toggle("on", calOpen);
  document.body.classList.toggle("calopen", calOpen);
  if (calOpen) renderCal();
  else { openMtg = null; clearMeetingFocus(); }
}
window.toggleCal = toggleCal;
calBtn.onclick = () => toggleCal();

window.addEventListener("resize", resize);
resize();
drawTimeline();
draw();

// deep links: #q=... auto-search · #cal=1 opens the week · #m=<idx> focuses a meeting
const hp = new URLSearchParams(location.hash.slice(1));
const hq = hp.get("q");
if (hq) { $("#q").value = hq; doSearch(); }
if (hp.get("frag") && dustIndexById.has(+hp.get("frag"))) openFragment(dustIndexById.get(+hp.get("frag")));
if (hp.get("topic") != null && typeof REGIONS !== "undefined" && REGIONS[+hp.get("topic")]) topicSearch(REGIONS[+hp.get("topic")]);
if (hp.get("cal") || hp.get("m") != null) toggleCal(true);
if (hp.get("m") != null && MEETINGS[+hp.get("m")]) {
  const i = +hp.get("m");
  calDay = MEETINGS[i].day; openMtg = i;
  setMeetingFocus(MEETINGS[i]); renderCal();
}
