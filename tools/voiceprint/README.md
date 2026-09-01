# Voiceprint

Turn anyone's LinkedIn `Comments.csv` (from their own data export) into a **portable,
queryable, ownable vector capsule** — their professional voice and attention graph in
one `.rvf` file.

```
node voiceprint.mjs --comments Comments.csv --out ./capsule --name myname \
  [--query "topic to probe"] [--dim 384] [--rvf /path/to/rvf]
```

## What comes out

| File | What it is |
|---|---|
| `<name>.rvf` | The capsule: fragment vectors, cosine/HNSW index, RVF container (signable, tamper-evident, copy-on-write branchable). Queries in milliseconds via `rvf query` / `rvf serve`, works from Rust, Node, browser WASM. |
| `fragments.jsonl` | Sidecar: id → text, date, post URL, addressed-person for every fragment |
| `meta.json` | Embedder state (needed to embed queries identically) |
| `report.md` | Human-readable: date span, most-addressed people, topic probes |

## Pipeline

1. **Parse** the LinkedIn export CSV (handles quoted multiline messages, guards misparsed rows).
2. **Fragment** each comment into sentence-level pieces (≥15 chars); detect who the comment
   addresses (LinkedIn flattens @-mentions to leading plain-text names; common non-name
   openers are blocklisted).
3. **Embed** each fragment. Default `--embedder onnx`: all-MiniLM-L6-v2 (quantized ONNX
   via transformers.js), mean-pooled, normalized, 384-d — real semantic retrieval; model
   is cached locally after first download. Fallback `--embedder hash`: zero-dependency
   hashed n-gram + IDF (word-match quality, fully offline).
4. **Build** the capsule with `rvf create/ingest` (built from `RuVector-main/crates/rvf`,
   `cargo build -p rvf-cli --release`).
5. **Probe** it: the report runs standard topic queries; `--query` runs your own.

## Proven on the first instance (Jacob, 2026-08)

19,892 comments (2013-07 → 2026-08) → 18,160 fragments → 28MB capsule with ONNX
embeddings. Independent validation: this parse counts Jennifer Womble addressed 235
times; the prior team's separate pipeline counted 234. Semantic probes work — "special
education staffing costs" retrieves his personnel-budget commentary with no shared
keywords. `rvf derive` produced a **162-byte** copy-on-write child capsule:
branch-per-engagement costs nothing.

Note: LinkedIn's Comments.csv contains imbalanced quotes that silently break
quote-state CSV parsers (two-thirds of records lost). `parseComments()` resynchronizes
on the record shape (`date,https…,message`) instead — if you adapt this tool, keep that.

## Why this is a product

- **The pitch:** "Fifteen years of your professional voice — who you lift up, what you
  actually know, how you sound — in one file that is yours. Not a SaaS account. A file."
- **Only needs what the person already owns**: their own LinkedIn data export. No scraping,
  no API, no ToS problem.
- **The ownership story is the moat**: RVF is signable and tamper-evident with DNA-style
  lineage — hand someone their capsule and they can verify what's inside and who made it.
  (Witness/signing must be enabled via runtime options at build time — v1 wiring TODO.)
- **Package fit**: the onboarding artifact for every mini-DODO (their book, vectorized,
  theirs from day one — only anonymized intelligence flows upstream); the substrate the
  Intern queries; a standalone deliverable for any consultant/connector client.

## Honest limits

- Fragment metadata lives in the sidecar, not in RVF metadata segments (CLI surface is
  id+vector today).
- Witness chain records 0 entries until witness mode is enabled in the ingest path.
- MiniLM is a fine default; a larger embedder (bge-small/base) is a drop-in upgrade via
  the same `initOnnx()` seam if retrieval needs more headroom.

Private note: `jacob-capsule/` contains real names from Jacob's comment history — same
handling rules as the rest of the project. The tool itself contains no data.
