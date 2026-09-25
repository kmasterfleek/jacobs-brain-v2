// Explore the dust: every fragment is hoverable and clickable, and topic regions are
// captioned on the map. Loaded before app.js — everything here is called at event/draw
// time, when app.js globals (toScreen, T, R, CX, CY, ctx, panel…) exist.

// ---------- spatial index over dust (normalized coords, 0.02 cells) ----------
const DCELL = 0.02, dustGrid = new Map();
for (let i = 0; i < DUST.x.length; i++) {
  const key = Math.floor(DUST.x[i] / 500 / DCELL) + "," + Math.floor(DUST.y[i] / 500 / DCELL);
  (dustGrid.get(key) || dustGrid.set(key, []).get(key)).push(i);
}
function hitDust(mx, my, px = 6) {
  const nx = (mx - CX - T.tx) / T.k / R, ny = (my - CY - T.ty) / T.k / R, rad = px / (R * T.k);
  const c0 = Math.floor((nx - rad) / DCELL), c1 = Math.floor((nx + rad) / DCELL);
  const r0 = Math.floor((ny - rad) / DCELL), r1 = Math.floor((ny + rad) / DCELL);
  let best = -1, bd = rad * rad;
  for (let cx = c0; cx <= c1; cx++) for (let cy = r0; cy <= r1; cy++) {
    for (const i of dustGrid.get(cx + "," + cy) || []) {
      const d = (DUST.x[i] / 500 - nx) ** 2 + (DUST.y[i] / 500 - ny) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
  }
  return best;
}

const fragCache = new Map();
function getFrag(id) {
  if (!fragCache.has(id)) fragCache.set(id, fetch(`/api/frag?id=${id}`).then(r => r.json()));
  return fragCache.get(id);
}
let hoverDust = -1;
function drawDustHover() {
  if (hoverDust < 0) return;
  const [x, y] = toScreen(DUST.x[hoverDust] / 500, DUST.y[hoverDust] / 500);
  ctx.strokeStyle = "rgba(233,231,222,.85)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.fillRect(x - 1, y - 1, 2, 2);
}
function dustTip(i, e, tip) {
  const id = DUST.id[i];
  tip.style.display = "block";
  tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + "px";
  tip.style.top = e.clientY + 12 + "px";
  tip.innerHTML = `<span class="muted">${YEAR0 + DUST.yr[i]} · loading…</span>`;
  getFrag(id).then(f => {
    if (hoverDust !== i || !f) return;
    const to = f.addressed && !SELF.test(f.addressed) ? ` · → ${esc(f.addressed)}` : "";
    tip.innerHTML = `${esc(f.text.slice(0, 180))}${f.text.length > 180 ? "…" : ""}<br><span class="muted">${f.date}${to} · click to open</span>`;
  });
}

// ---------- one fragment in the panel, with "more like this" ----------
async function openFragment(i) {
  const f = await getFrag(DUST.id[i]);
  if (!f) return;
  selected = null;
  panel.classList.add("show"); $("#timeline").classList.remove("wide");
  const pi = DUST.pi[i], star = pi >= 0 ? PEOPLE[pi] : null;
  const to = f.addressed && !SELF.test(f.addressed)
    ? (star ? `<div class="p-hit" data-pi="${pi}"><span>said to ✦ ${esc(star.name)}</span><b>${star.n}</b></div>` : `<div class="sub">said to ${esc(f.addressed)} — not in the sky</div>`)
    : "";
  panel.innerHTML = `<button class="x" onclick="closePanel()">×</button>
    <div class="sub">${f.date}${f.url ? ` · <a href="${f.url}" target="_blank" style="color:var(--accent);text-decoration:none">on LinkedIn ↗</a>` : ""}</div>
    <div class="frag hit" style="font-size:14px;color:var(--ink);margin-top:10px">${esc(f.text)}</div>
    ${to}
    <button id="like" class="likebtn">✦ More like this</button>
    <div class="sub" style="margin-top:6px">lights every fragment that means something similar — no search words needed</div>`;
  panel.querySelectorAll(".p-hit").forEach(el => el.onclick = () => openPerson(PEOPLE[+el.dataset.pi]));
  $("#like").onclick = () => likeSearch(f.id, `like: “${f.text.slice(0, 48)}${f.text.length > 48 ? "…" : ""}”`);
}
async function likeSearch(id, label) {
  $("#status").innerHTML = "finding what's near it…";
  const res = await fetch(`/api/like?id=${id}&k=80`).then(r => r.json());
  $("#q").value = "";
  applySearch(res, label);
}

// ---------- topic regions: captions that yield to each other, more appear as you zoom ----------
let regionBoxes = [];
function drawRegions() {
  regionBoxes = [];
  if (typeof REGIONS === "undefined") return;
  ctx.font = "600 10.5px system-ui, sans-serif";
  const placed = [];
  for (const r of [...REGIONS].sort((a, b) => b.n - a.n)) {
    const [x, y] = toScreen(r.x, r.y);
    const txt = r.label.toUpperCase(), w = ctx.measureText(txt).width + txt.length * 1.2, h = 14;
    const box = { x: x - w / 2, y: y - h / 2, w, h, r };
    if (x < 0 || x > W || y < 0 || y > H) continue;
    if (placed.some(b => box.x < b.x + b.w + 10 && box.x + w + 10 > b.x && box.y < b.y + b.h + 6 && box.y + h + 6 > b.y)) continue;
    placed.push(box);
    const hot = hoverRegion === r;
    ctx.fillStyle = hot ? "rgba(197,189,245,.95)" : `rgba(157,147,230,${hitByPerson || focusPpl ? 0.35 : 0.62})`;
    ctx.letterSpacing = "1.2px";
    ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(13,13,13,.9)"; ctx.lineJoin = "round";
    ctx.strokeText(txt, box.x, y + 4);
    ctx.fillText(txt, box.x, y + 4);
    ctx.letterSpacing = "0px";
    if (hot) { ctx.fillRect(box.x, y + 7, w - 2, 1); }
    regionBoxes.push(box);
  }
}
let hoverRegion = null;
function hitRegion(mx, my) {
  return (regionBoxes.find(b => mx >= b.x - 4 && mx <= b.x + b.w + 4 && my >= b.y - 4 && my <= b.y + b.h + 4) || {}).r || null;
}
function regionTip(r, e, tip) {
  tip.style.display = "block";
  tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + "px";
  tip.style.top = e.clientY + 12 + "px";
  tip.innerHTML = `<strong>${esc(r.label)}</strong><br><span class="muted">${r.n} substantive pieces · click to light them and see who this topic belongs to</span>`;
}
// light a topic's own members (most typical first) — exact, not a proxy search
async function topicSearch(r) {
  $("#status").innerHTML = "lighting the topic…";
  const res = await fetch(`/api/frags?ids=${r.members.join(",")}`).then(x => x.json());
  $("#q").value = "";
  applySearch(res, "Topic: " + r.label);
}
