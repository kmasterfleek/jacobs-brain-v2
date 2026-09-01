// Observatory server: static UI + live semantic search over Jacob's capsule.
//   node serve.mjs   →  http://127.0.0.1:8474
// Queries are embedded with the same MiniLM model that built the capsule.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = import.meta.dirname;
const CAP = path.join(ROOT, "../../tools/voiceprint/jacob-capsule");
const PORT = 8474;

console.log("loading capsule…");
const frags = fs.readFileSync(path.join(CAP, "fragments.jsonl"), "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
const raw = JSON.parse(fs.readFileSync(path.join(CAP, "vectors.json"), "utf8"));
const N = raw.length, D = raw[0].vector.length;
const M = new Float32Array(N * D);
const ids = new Int32Array(N);
raw.forEach((r, i) => { ids[i] = r.id; M.set(r.vector, i * D); });
const byId = new Map(frags.map(f => [f.id, f]));
console.log(`capsule in memory: ${N} × ${D}`);

console.log("loading embedder…");
const { pipeline } = await import("@xenova/transformers");
const fe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
console.log("ready.");

async function search(q, k = 60) {
  const t = await fe([q], { pooling: "mean", normalize: true });
  const qv = t.data;
  const scores = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0; const o = i * D;
    for (let j = 0; j < D; j++) s += M[o + j] * qv[j];
    scores[i] = s;
  }
  const idx = [...scores.keys()].sort((a, b) => scores[b] - scores[a]).slice(0, k);
  return idx.map(i => { const f = byId.get(ids[i]); return { score: +scores[i].toFixed(3), ...f }; });
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (url.pathname === "/api/search") {
      const out = await search(url.searchParams.get("q") || "", +(url.searchParams.get("k") || 60));
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(out)); return;
    }
    if (url.pathname === "/api/person") {
      const name = (url.searchParams.get("name") || "").toLowerCase();
      const out = frags.filter(f => f.addressed && f.addressed.toLowerCase().includes(name)).slice(-40).reverse();
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(out)); return;
    }
    let p = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = path.join(ROOT, path.normalize(p).replace(/^([.][.][/\\])+/, ""));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(PORT, "127.0.0.1", () => console.log(`Observatory → http://127.0.0.1:${PORT}`));
