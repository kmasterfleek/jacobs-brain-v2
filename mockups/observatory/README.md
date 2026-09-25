# The Observatory

Jacob's capsule as a navigable sky: semantic search over 18,160 comment fragments
(2013→2026), the people he addresses as stars, the Intern's knowledge in the panels,
this week's calendar wired in. Companion to the Constellation mockup (which is
untouched); this one is data-real end to end.

## Run

```
node serve.mjs        # → http://127.0.0.1:8474
```

The server loads the capsule (`tools/voiceprint/jacob-capsule/`) into memory and embeds
queries live with the same MiniLM model that built it. `node_modules` is symlinked from
`tools/voiceprint`. To refresh the sky after a capsule rebuild:

```
node build_observatory.mjs   # regenerates data.js (people, PCA layout, dust, calendar links)
```

## First visit: the guided tour

A 13-step tour runs automatically the first time the page opens in a browser: it spotlights
each part (stars, a person's card, dust, topics, the Show toggles, the calendar, a meeting,
the add-someone box, semantic search) and asks the viewer to actually click each thing — the
step advances when they do. The last interactive step runs a pre-filled example search
("teachers leaving the profession"). Replay anytime with **? Tour** in the header, or `#tour`
(`#tour=N` jumps to step N). Esc or "Skip tour" ends it.

## What's on screen

- **Stars** = the 160 people Jacob addresses most (≥4 mentions over 13 years), sized by
  mention count, **positioned by semantic PCA of their fragment centroids** — people he
  talks to about similar things sit near each other.
- **Dust** = all 18,160 fragments projected into the same space. **Hover** any dot to read it;
  **click** to open it with its date, who it was said to, and **✦ More like this** — which
  lights everything similar using that fragment's own vector (no search words needed).
- **Topic captions** (violet) = 18 subjects he keeps returning to, found by clustering
  substantive fragments by meaning (`regions.json` holds the hand-written captions; after a
  capsule rebuild, reread `.regions-review.json` and relabel). Captions yield to each other,
  so more appear as you zoom. **Click one** to light its members and see who the topic belongs
  to — a topic with few people in the answer is one he talks about but nobody owns.
- **Search** lights matching fragments, draws lines to whoever each was said to, and the
  panel ranks "who this topic belongs to" — search is the question, *people are the answer*.
- **Amber ring** = on this week's calendar. **Timeline** = fragments/year (sqrt scale),
  with matches overlaid — when a topic lived.
- **Click a star**: mentions, span, per-year sparkline, roster role + message stats
  (Intern pool), seed judgments from the voice pass, this week's meetings, and their
  actual fragments from the capsule.
- **Show: Topics / Names / Key** (bottom-left, or press T / N / K) — remembered per viewer. Names and
  topics yield to each other (~10 names and 6 topics at full view, more as you zoom); while a
  search or meeting is lit, only the answer is named and topic captions step back.
- Drag to pan, scroll to zoom, `#q=...` deep-links a search. `#frag=<id>` opens one fragment; `#topic=<k>` lights a topic.
- **⚑ This week's calendar** (header button): the full Mon–Fri meeting list from the
  trainer's week demo, with the intern's prep notes and ask-stacking flags. Click a
  meeting → attendees who live in the sky get an amber beacon and all fragments Jacob
  ever addressed to them glow amber (everyone else dims). Each meeting has a
  "guess the topic" box — type what you think the meeting is about and it runs the
  normal semantic search, so you can see whether the lit topic clusters around the
  people in the room. `#cal=1` opens the drawer; `#m=<idx>` focuses a meeting.
- **Fixing missed attendees**: each meeting has a "＋ add someone" box — a loose
  typeahead over the 160 stars (substring, word-prefix, then 3-letter-prefix, so
  "Wombel" still finds Jennifer Womble). Added people beacon with the meeting, get
  the amber calendar ring, and show the meeting in their panel. Fixes persist in
  localStorage (`dodo-observatory-cal-v1`) as normalized names, so they survive
  data.js rebuilds; × on a chip removes one. The build-time matcher also
  prefix-matches first names (Steve → Steven Iglesias).

## Notes

- Jacob's own name is filtered out of the star field (self-mentions in threads).
- Person↔pool↔calendar joins are name-normalized exact-ish matches; 27 of 160 stars
  currently join to the roster pool, 4 to this week's calendar.
- Private: renders real names and real commentary. Local only, never publish.
