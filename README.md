# Jacob's Brain — DODO 2.0 workspace

Private workspace of tools built around Jacob Kantor's network: his 13 years of
LinkedIn commentary vectorized into a searchable capsule, plus three browser apps
for exploring it. **This repo contains real names and candid notes — keep it
private, never publish or screenshot without blurring names.**

## For Claude Code: set this up and get it running

If you are Claude Code and a user pointed you here, do the following. The goal is
both visualizations running and their URLs handed to the user.

### 1. Check prerequisites

- `node --version` — need Node 18+ (20+ preferred)
- `python3 --version` — any Python 3
- Internet access on first run (a ~30MB embedding model downloads once)

If Node is missing on macOS, install it (e.g. `brew install node`) or ask the user.

### 2. One-time setup

```bash
cd tools/voiceprint
npm install                       # installs @xenova/transformers + onnxruntime

cd ../../mockups/observatory
[ -e node_modules ] || ln -s ../../tools/voiceprint/node_modules node_modules
```

Both steps are safe to re-run.

### 3. Start the two apps (run each in the background)

```bash
# The Observatory — semantic search over the capsule + this week's calendar
cd mockups/observatory && node serve.mjs
# wait for "ready." then "Observatory → http://127.0.0.1:8474" in its output;
# first ever run also prints model-download progress — that's normal, wait it out

# The Constellation — static mockup, any static server works
cd mockups/constellation && python3 -m http.server 8475 --bind 127.0.0.1
```

### 4. Verify before telling the user it's ready

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8474/    # expect 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8475/    # expect 200
curl -s "http://127.0.0.1:8474/api/search?q=rural%20schools&k=1"   # expect JSON with a score
```

Then give the user both URLs:

- **The Observatory** → http://127.0.0.1:8474 — search the capsule, open the
  "⚑ This week's calendar" drawer, click a meeting to light up its people
- **The Constellation** → http://127.0.0.1:8475 — the ring/Dojo mockup
  (demo deep link: `http://127.0.0.1:8475/#co=zen&sel=eric-brooks&dojo=1&opener=theirs`)

### Troubleshooting

- **Port already in use** — something from a previous run is alive; either just
  verify with curl and reuse it, or `pkill -f serve.mjs` / `pkill -f "http.server 8475"` and restart.
- **Observatory exits with a module error** — the `node_modules` symlink in
  `mockups/observatory` is missing or `npm install` didn't finish; redo step 2.
- **First search is slow / server takes ~1 min to say "ready."** — it loads
  18,160 × 384 vectors into memory and the MiniLM embedder; that's normal.
- **Model download fails** — no internet or Hugging Face unreachable; retry when online.

## What's in here

| Path | What it is |
|------|-----------|
| `mockups/observatory/` | The Observatory: capsule as a navigable sky + calendar (see its README) |
| `mockups/constellation/` | The Constellation: ring visualization + Dojo rehearsal (demo data, do not modify) |
| `mockups/trainer/` | The Intern trainer (`index.html`) + week demo (`week.html`) — open as static pages |
| `tools/voiceprint/` | LinkedIn Comments.csv → RVF vector capsule pipeline (see its README) |
| `tools/voiceprint/jacob-capsule/` | Jacob's built capsule: 18,160 fragment vectors, 2013→2026 |
| `raw-data/` | Roster CSVs + LinkedIn export. **Read `raw-data/CAVEATS.md` before touching this.** |
| `docs/` | DODO 2.0 direction + client matchboard |
| `RuVector-main/crates/rvf` | Vendored rvf crate — only needed to rebuild capsules (`cargo build -p rvf-cli --release`) |

## Privacy rules (non-negotiable)

- Everything here identifies real public-education officials with candid notes.
  Local use only — never publish, commit elsewhere, or paste contents into public tools.
- `raw-data/linkedin-export/messages.csv` is deliberately absent from this repo
  and must never be added to it.
- Low LinkedIn activity never means low value; Jacob's spoken account beats file data.
