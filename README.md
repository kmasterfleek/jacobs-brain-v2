# Jacob's Brain — DODO 2.0 workspace

Private workspace of tools built around Jacob Kantor's network: his 13 years of
LinkedIn commentary vectorized into a searchable capsule, plus browser apps for
exploring it. **This contains real names and candid notes — keep it on your own
computer, never share the folder, and blur names in any screenshot.**

## Jacob — start here (about 10 minutes, once)

1. On the GitHub page for this project, click the green **Code** button → **Download ZIP**.
2. Double-click the ZIP to unzip it. Move the folder somewhere you'll find it again
   (Documents is fine).
3. Open **Claude Code** in that folder, and type:

   > Read the README and get everything running.

4. Claude will install what's needed and hand you a link. Open it — a short guided tour
   starts on its own and walks you through everything.

Next time, just open Claude Code in the same folder and say *"start the Observatory"*.

## For Claude Code: set this up and get it running

If you are Claude Code and a user pointed you here, do the following. The goal is
both visualizations running and their URLs handed to the user.

This folder most likely came from GitHub's **Download ZIP** (named like
`jacobs-brain-v2-main`): there is no git history and none is needed — don't run git
commands, don't try to push anything, and don't upload or paste this data anywhere.
The user is not technical: do every step yourself, keep your messages short and plain,
and ask them only for things you truly can't do (like approving an install).

### 1. Check prerequisites

- `node --version` — need Node 18+ (20+ preferred)
- `python3 --version` — any Python 3
- Internet access on first run (a ~30MB embedding model downloads once)

If Node is missing: on macOS use `brew install node` if Homebrew exists; otherwise send the
user to https://nodejs.org (the LTS installer — download, double-click, Continue through it),
wait for them to say it's done, then continue. Python 3 is only needed for the Constellation;
if it's missing, skip that app and say so.

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

Then open the Observatory in their browser (`open http://127.0.0.1:8474` on macOS) and give them both URLs:

- **The Observatory** → http://127.0.0.1:8474 — a guided tour starts automatically on the
  first visit and walks through everything (replay anytime with "? Tour"); tell the user to
  just open the link and follow it
- **The Constellation** → http://127.0.0.1:8475 — the ring/Dojo mockup
  (demo deep link: `http://127.0.0.1:8475/#co=zen&sel=eric-brooks&dojo=1&opener=theirs`)

### Later sessions

If the user asks to "start the Observatory" (or anything like it): the setup is already
done — skip to step 3, start the servers, verify, and open the link.

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
| `mockups/observatory-demo/` | Guided-demo Observatory: identical to the real one with every name pseudonymized (`node build_demo.mjs` regenerates; `node serve.mjs` → :8476). Jacob and Kunal stay real. The calendar is cast onto the demo sky (`demo_calendar.mjs`): every meeting has at least one star, chosen by meaning, with one real person → one star all week; personal entries become "Coffee catch-up". Don't click ↗ links live — they open the real posts. |
| `mockups/trainer/` | The Intern trainer (`index.html`) + week demo (`week.html`) — open as static pages |
| `tools/voiceprint/` | LinkedIn Comments.csv → RVF vector capsule pipeline (see its README) |
| `tools/voiceprint/jacob-capsule/` | Jacob's built capsule: 18,160 fragment vectors, 2013→2026 |
| `raw-data/` | Roster CSVs + LinkedIn export. **Read `raw-data/CAVEATS.md` before touching this.** |
| `docs/` | DODO 2.0 direction + client matchboard |
| `RuVector-main/crates/rvf` | Vendored rvf crate — only needed to rebuild capsules (`cargo build -p rvf-cli --release`). Not included in the ZIP download. |

## Privacy rules (non-negotiable)

- Everything here identifies real public-education officials with candid notes.
  Local use only — never publish, commit elsewhere, or paste contents into public tools.
- `raw-data/linkedin-export/messages.csv` is deliberately absent from this repo
  and must never be added to it.
- Low LinkedIn activity never means low value; Jacob's spoken account beats file data.
