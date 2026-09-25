// Builds data.js for the Observatory from Jacob's capsule + trainer pool + week calendar.
// People are positioned by PCA of their fragment-embedding centroids (semantic map);
// all fragments project into the same 2D space as dust.
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Volumes/LaCie/jacobs brain v2";
const CAP = path.join(ROOT, "tools/voiceprint/jacob-capsule");

const frags = fs.readFileSync(path.join(CAP, "fragments.jsonl"), "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
const vecs = JSON.parse(fs.readFileSync(path.join(CAP, "vectors.json"), "utf8"));
const V = new Map(vecs.map(v => [v.id, v.vector]));
console.log("fragments:", frags.length);

// ---- person stats ----
const norm = (n) => n.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z\s.'-]/g, "").replace(/\b(phd|edd|med|mba|dr|jr|sr|ii|iii|he|him|his|she|her)\b\.?/g, "").replace(/\s+/g, " ").trim();
const people = new Map();
for (const f of frags) {
  if (!f.addressed) continue;
  const key = norm(f.addressed);
  if (!key || key.split(" ").length < 2) continue;
  if (key.startsWith("jacob kantor")) continue; // the operator isn't a star in his own sky
  let p = people.get(key);
  if (!p) people.set(key, p = { key, name: f.addressed, n: 0, ids: [], years: {}, first: f.date, last: f.date });
  p.n++; p.ids.push(f.id);
  const y = f.date.slice(0, 4); p.years[y] = (p.years[y] || 0) + 1;
  if (f.date < p.first) p.first = f.date;
  if (f.date > p.last) p.last = f.date;
}
const ranked = [...people.values()].sort((a, b) => b.n - a.n);
const TOP = ranked.filter(p => p.n >= 4).slice(0, 160);
console.log("people (≥4 mentions):", TOP.length, "| top:", TOP.slice(0, 3).map(p => p.name + ":" + p.n).join(", "));

// ---- centroids + PCA ----
const D = 384;
function centroid(ids) {
  const c = new Float64Array(D);
  for (const id of ids) { const v = V.get(id); if (v) for (let i = 0; i < D; i++) c[i] += v[i]; }
  let n = Math.hypot(...c) || 1;
  return Array.from(c, x => x / n);
}
for (const p of TOP) p.c = centroid(p.ids);

const mean = new Float64Array(D);
for (const p of TOP) for (let i = 0; i < D; i++) mean[i] += p.c[i] / TOP.length;
const rows = TOP.map(p => p.c.map((x, i) => x - mean[i]));
function powerIter(rows, deflate) {
  let v = new Float64Array(D).map((_, i) => Math.sin(i * 12.9898) * 43758.5453 % 1);
  for (let it = 0; it < 40; it++) {
    const nv = new Float64Array(D);
    for (const r of rows) {
      let dot = 0; for (let i = 0; i < D; i++) dot += r[i] * v[i];
      for (let i = 0; i < D; i++) nv[i] += dot * r[i];
    }
    if (deflate) { // remove component along deflate
      let d = 0; for (let i = 0; i < D; i++) d += nv[i] * deflate[i];
      for (let i = 0; i < D; i++) nv[i] -= d * deflate[i];
    }
    const n = Math.hypot(...nv) || 1;
    v = nv.map(x => x / n);
  }
  return v;
}
const pc1 = powerIter(rows, null);
const pc2 = powerIter(rows, pc1);
const proj = (vec) => {
  let x = 0, y = 0;
  for (let i = 0; i < D; i++) { const c = vec[i] - mean[i]; x += c * pc1[i]; y += c * pc2[i]; }
  return [x, y];
};
let xs = [], ys = [];
for (const p of TOP) { const [x, y] = proj(p.c); p.x = x; p.y = y; xs.push(x); ys.push(y); }
const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
const sx = (x) => ((x - xmin) / (xmax - xmin) - 0.5) * 2;
const sy = (y) => ((y - ymin) / (ymax - ymin) - 0.5) * 2;
for (const p of TOP) { p.x = +sx(p.x).toFixed(3); p.y = +sy(p.y).toFixed(3); }

// dust: every fragment projected (quantized), tagged with person index + year
const personIdx = new Map(TOP.map((p, i) => [p.key, i]));
const dust = { x: [], y: [], yr: [], pi: [], id: [] };
for (const f of frags) {
  const v = V.get(f.id); if (!v) continue;
  const [x, y] = proj(v);
  dust.x.push(Math.round(Math.max(-1.15, Math.min(1.15, sx(x))) * 500));
  dust.y.push(Math.round(Math.max(-1.15, Math.min(1.15, sy(y))) * 500));
  dust.yr.push(+f.date.slice(0, 4) - 2013);
  const key = f.addressed ? norm(f.addressed) : null;
  dust.pi.push(key != null && personIdx.has(key) ? personIdx.get(key) : -1);
  dust.id.push(f.id);
}

// ---- intern pool + seed judgments + calendar links ----
const poolSrc = fs.readFileSync(path.join(ROOT, "mockups/trainer/pool.js"), "utf8");
(0, eval)(poolSrc + ";globalThis.POOL=POOL;");
const poolByKey = new Map(POOL.map(p => [norm(p.name), p]));
const SEED_NOTES = {
  "jennifer womble": "Hub of hubs — top referral source; 12+ roster referrals trace to her.",
  "allen pratt": "Multiplier — access 5 / openness 3. Ask for the map, not the meeting.",
  "eric brooks": "Domain gate: literacy / MTSS / state programs only.",
  "kiela jimenez": "Paid advisor — an instrument, not a pitch target.",
  "jeff piontek": "Connector into Clark County & NYC. Validator, not buyer.",
};
const weekSrc = fs.readFileSync(path.join(ROOT, "mockups/trainer/week.js"), "utf8");
(0, eval)(weekSrc.split("// ---------------- app ----------------")[0] + ";globalThis.CAL=CAL;globalThis.CAL_COMPANIES=CAL_COMPANIES;globalThis.WEEK_START=typeof WEEK_START!=='undefined'?WEEK_START:'2026-08-17';");
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const calFor = (key) => CAL.filter(e => (e.contacts || []).some(c => {
  const ck = norm(c); return ck === key || (ck.split(" ")[0] === key.split(" ")[0] && key.includes(ck.split(" ").pop() || "@"));
})).map(e => `${DAYS[e.day]} ${e.t} — ${e.title}`);

// full meeting list for the in-sky calendar: resolve each meeting's people to star indices
const matchKey = (ck) => {
  if (personIdx.has(ck)) return personIdx.get(ck);
  const [cf, ...rest] = ck.split(" "); const cl = rest.pop();
  if (!cl) return null;
  for (const [key, i] of personIdx) {
    const kp = key.split(" ");
    const firstOk = kp[0] === cf
      || (cf.length >= 4 && kp[0].startsWith(cf))    // Steve → Steven
      || (kp[0].length >= 4 && cf.startsWith(kp[0]));
    if (firstOk && key.includes(cl)) return i;
  }
  return null;
};
const MEETINGS = CAL.map(e => {
  const ppl = new Set();
  for (const c of e.contacts || []) { const i = matchKey(norm(c)); if (i != null) ppl.add(i); }
  const tl = " " + norm(e.title) + " ";
  for (const [key, i] of personIdx) {
    const kp = key.split(" ");
    if (kp[0].length > 2 && kp[kp.length - 1].length > 2 && tl.includes(" " + kp[0] + " ") && tl.includes(kp[kp.length - 1])) ppl.add(i);
  }
  return {
    day: e.day, t: e.t, title: e.title, kind: e.kind,
    co: (e.co || []).map(k => CAL_COMPANIES[k]).filter(Boolean),
    prep: e.prep || null, flag: e.flag || null, stale: e.stale || null,
    contacts: e.contacts || [], ppl: [...ppl],
  };
});
console.log("meetings:", MEETINGS.length, "| with people in the sky:", MEETINGS.filter(m => m.ppl.length).length);

const OUT_PEOPLE = TOP.map((p, i) => {
  const pool = poolByKey.get(p.key);
  return {
    i, name: p.name.replace(/[^\w\s.'-]/g, "").trim(), n: p.n, first: p.first, last: p.last,
    x: p.x, y: p.y, years: p.years,
    role: pool ? [pool.role, pool.org].filter(Boolean).join(", ") : null,
    msgs: pool && pool.msgs ? pool.msgs : null, lat: pool ? pool.latencyH : null,
    note: SEED_NOTES[p.key] || null,
    cal: calFor(p.key),
  };
});

fs.writeFileSync(path.join(ROOT, "mockups/observatory/data.js"),
  "// Generated by build_observatory.mjs — capsule + pool + calendar. Private.\n" +
  "const PEOPLE = " + JSON.stringify(OUT_PEOPLE) + ";\n" +
  "const DUST = " + JSON.stringify(dust) + ";\n" +
  "const MEETINGS = " + JSON.stringify(MEETINGS) + ";\n" +
  "const WEEK_START = " + JSON.stringify(WEEK_START) + ";\n" +
  "const YEAR0 = 2013, YEARS = 14;\n");
const size = fs.statSync(path.join(ROOT, "mockups/observatory/data.js")).size;
console.log("data.js written:", (size / 1024).toFixed(0) + "KB",
  "| dust points:", dust.x.length,
  "| people with pool match:", OUT_PEOPLE.filter(p => p.role).length,
  "| with calendar:", OUT_PEOPLE.filter(p => p.cal.length).length);
