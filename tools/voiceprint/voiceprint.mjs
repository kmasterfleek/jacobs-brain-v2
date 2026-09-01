#!/usr/bin/env node
// Voiceprint — turn a LinkedIn Comments.csv into a portable RVF vector capsule.
//   node voiceprint.mjs --comments <Comments.csv> --out <dir> --name <label>
//        [--embedder onnx|hash] [--rvf <rvf binary>] [--query "text"] [--k 8]
//
// onnx (default): all-MiniLM-L6-v2 via transformers.js — real semantic embeddings,
//   384-d, mean-pooled, normalized. Model cached locally after first download.
// hash: zero-dependency hashed n-gram + IDF fallback (word-match quality).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const arg = (name, dflt) => {
  const i = process.argv.indexOf("--" + name);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const COMMENTS = arg("comments");
const OUT = arg("out", "./capsule");
const NAME = arg("name", "voiceprint");
const RVF = arg("rvf", path.join(import.meta.dirname, "../../RuVector-main/crates/rvf/target/release/rvf"));
const EMBEDDER = arg("embedder", "onnx");
const QUERY = arg("query", null);
const K = +arg("k", 8);
if (!COMMENTS) { console.error("--comments <Comments.csv> required"); process.exit(1); }

// ---------- parser ----------
// LinkedIn Comments.csv is Date,Link,Message with messages that may span lines
// and contain imbalanced quotes. A quote-state CSV parser silently swallows
// records when quoting breaks, so we resynchronize on the unambiguous record
// shape instead: every record starts "YYYY-MM-DD HH:MM:SS,https…".
function parseComments(text) {
  const records = text.replace(/\r\n/g, "\n")
    .split(/\n(?=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},)/g);
  const rows = [];
  for (const rec of records) {
    const m = rec.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),([^,\n]*),([\s\S]*)$/);
    if (!m) continue;
    let msg = m[3].trim();
    if (msg.startsWith('"') && msg.endsWith('"')) msg = msg.slice(1, -1);
    msg = msg.replace(/""/g, '"').trim();
    rows.push([m[1], m[2], msg]);
  }
  return rows;
}

// ---------- fragmenting ----------
const NAME_RE = /^((?:[A-Z][\w'.-]+\s){1,3}[A-Z][\w'.-]+)[\s,–—-]/;
const NOT_NAMES = new Set(["congrats", "thanks", "thank", "great", "love", "this", "yes", "the", "happy", "well", "good", "amazing", "awesome", "wow", "so", "very", "totally", "absolutely", "agreed", "exactly", "nice", "beautiful", "brilliant", "such"]);
function fragments(msg) {
  const out = [];
  let addressed = null;
  const m = msg.match(NAME_RE);
  if (m && m[1].split(/\s/).length <= 4 && !NOT_NAMES.has(m[1].split(/\s/)[0].toLowerCase())) addressed = m[1].trim();
  const parts = msg.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])|\n+/g);
  for (let p of parts) {
    p = p.trim();
    if (p.length < 15) continue;
    while (p.length > 300) { out.push(p.slice(0, 300)); p = p.slice(300); }
    if (p.length >= 15) out.push(p);
  }
  return { addressed, parts: out };
}

// ---------- embedders (pluggable: async (texts[]) => number[][]) ----------
let DIM, embedBatch, embedderId;

async function initOnnx() {
  const { pipeline: hf } = await import("@xenova/transformers");
  const fe = await hf("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
  DIM = 384;
  embedderId = "onnx:Xenova/all-MiniLM-L6-v2 (mean-pool, normalized, quantized)";
  embedBatch = async (texts) => {
    const out = [];
    const B = 64;
    for (let i = 0; i < texts.length; i += B) {
      const chunk = texts.slice(i, i + B);
      const t = await fe(chunk, { pooling: "mean", normalize: true });
      for (let j = 0; j < chunk.length; j++)
        out.push(Array.from(t.slice([j, j + 1]).data, x => +x.toFixed(5)));
      if (texts.length > B) process.stdout.write(`\r  embedding ${Math.min(i + B, texts.length)}/${texts.length}`);
    }
    if (texts.length > 64) process.stdout.write("\n");
    return out;
  };
}

const STOP = new Set(("a an the and or but if then than that this these those i you he she it we they is are was were be been being do does did have has had will would should could can may might must not no yes so to of in on at by for with about as from into over under again there here when where who whom which what why how all any both each few more most other some such only own same too very just don should've im its it's i'm you're we're they're isn't don't didn't doesn't won't can't couldn't wouldn't shouldn't your my our their his her me him them us out up down off once because while during before after above below between through").split(/\s+/));
function fnv(str, seed = 0x811c9dc5) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function hashFeatures(text) {
  const t = text.toLowerCase().replace(/https?:\S+/g, " ").replace(/[^a-z0-9\s']/g, " ");
  const words = t.split(/\s+/).filter(w => w.length > 1);
  const content = words.filter(w => !STOP.has(w));
  const feats = [...content];
  for (let i = 0; i < words.length - 1; i++)
    if (!STOP.has(words[i]) || !STOP.has(words[i + 1])) feats.push(words[i] + "_" + words[i + 1]);
  for (const w of content) if (w.length >= 5) for (let i = 0; i <= w.length - 4; i++) feats.push("#" + w.slice(i, i + 4));
  return feats;
}
let hashDf = null, hashN = 0;
function initHash(allTexts) {
  DIM = 384;
  embedderId = "hash:ngram-idf-v1";
  hashDf = new Float32Array(DIM); hashN = allTexts.length;
  for (const t of allTexts) {
    const buckets = new Set(hashFeatures(t).map(x => fnv(x) % DIM));
    for (const b of buckets) hashDf[b]++;
  }
  embedBatch = async (texts) => texts.map(text => {
    const v = new Float32Array(DIM);
    for (const f of hashFeatures(text)) {
      const b = fnv(f) % DIM, sign = (fnv(f, 0x1234567) & 1) ? 1 : -1;
      v[b] += sign * (Math.log((hashN + 1) / ((hashDf[b] || 0) + 1)) + 1);
    }
    const n = Math.hypot(...v) || 1;
    return Array.from(v, x => +(x / n).toFixed(5));
  });
}

// ---------- main ----------
console.log("Voiceprint · reading", COMMENTS, "· embedder:", EMBEDDER);
const rows = parseComments(fs.readFileSync(COMMENTS, "utf8"));
const iDate = 0, iMsg = 2;
const frags = [];
const addressedCount = {};
const seen = new Set();
for (const r of rows) {
  const msg = r[iMsg];
  if (!msg) continue;
  const { addressed, parts } = fragments(msg);
  if (addressed) addressedCount[addressed] = (addressedCount[addressed] || 0) + 1;
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    frags.push({ id: frags.length + 1, date: (r[iDate] || "").slice(0, 10), url: r[1] || "", addressed, text: p });
  }
}
console.log(`fragments: ${frags.length} (from ${rows.length} comments)`);

if (EMBEDDER === "onnx") await initOnnx(); else initHash(frags.map(f => f.text));
const t0 = Date.now();
const vecs = await embedBatch(frags.map(f => f.text));
console.log(`embedded ${vecs.length} fragments in ${((Date.now() - t0) / 1000).toFixed(1)}s (${embedderId})`);
frags.forEach((f, i) => { f.vector = vecs[i]; });

fs.mkdirSync(OUT, { recursive: true });
const rvfPath = path.join(OUT, NAME + ".rvf");
const vecPath = path.join(OUT, "vectors.json");
fs.writeFileSync(vecPath, JSON.stringify(frags.map(f => ({ id: f.id, vector: f.vector }))));
fs.writeFileSync(path.join(OUT, "fragments.jsonl"), frags.map(f =>
  JSON.stringify({ id: f.id, date: f.date, url: f.url, addressed: f.addressed, text: f.text })).join("\n"));
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ name: NAME, dim: DIM, n: frags.length,
  embedder: embedderId, df: hashDf ? Array.from(hashDf) : null, created: new Date().toISOString() }));

if (fs.existsSync(rvfPath)) fs.rmSync(rvfPath);
const run = (args) => execFileSync(RVF, args, { encoding: "utf8", maxBuffer: 64e6 });
console.log(run(["create", rvfPath, "--dimension", String(DIM), "--metric", "cosine"]).trim());
console.log(run(["ingest", rvfPath, "--input", vecPath]).trim());
console.log(run(["status", rvfPath]).trim());

// ---------- report + probes ----------
async function search(q, k) {
  const [qv] = await embedBatch([q]);
  const res = JSON.parse(run(["query", rvfPath, "--vector=" + qv.join(","), "-k", String(k), "--json"]));
  const list = res.results || res;
  return list.map(r => { const f = frags[(r.id ?? r) - 1]; return { d: (r.distance ?? 0).toFixed(3), ...f }; });
}
const topAddr = Object.entries(addressedCount).sort((a, b) => b[1] - a[1]).slice(0, 15);
const dates = frags.map(f => f.date).filter(Boolean).sort();
const probes = ["special education staffing costs", "free math tutoring with research evidence", "AI in the classroom", "rural school districts", "advice for ed-tech founders on selling to districts"];
let report = `# Voiceprint capsule — ${NAME}\n\n${frags.length} fragments from ${rows.length} comments · ${dates[0]} → ${dates[dates.length - 1]}\nEmbedder: ${embedderId}\nCapsule: ${NAME}.rvf (cosine, ${DIM}-d, HNSW-indexed, portable)\n\n## Most-addressed people\n`;
report += topAddr.map(([n, c]) => `- ${n} — ${c}`).join("\n");
report += `\n\n## Topic probes (top-3 fragments each)\n`;
for (const p of probes) {
  report += `\n**“${p}”**\n`;
  for (const r of await search(p, 3)) report += `- (${r.date}) ${r.text.slice(0, 150)}\n`;
}
fs.writeFileSync(path.join(OUT, "report.md"), report);
console.log("\n— capsule written to", OUT);

if (QUERY) {
  console.log(`\nquery: "${QUERY}"`);
  for (const r of await search(QUERY, K)) console.log(`  [${r.d}] (${r.date}) ${r.addressed ? "→" + r.addressed + " · " : ""}${r.text.slice(0, 110)}`);
}
