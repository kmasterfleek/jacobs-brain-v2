// Casts the guided-demo calendar onto the demo sky: every meeting points at one or more
// stars, and every name in a title/prep is the name of a star on the map.
//   · attendees who really are stars stay themselves
//   · everyone else is cast as the star whose conversations best match the meeting's text
//     (MiniLM embedding vs. each star's fragment centroid), so a topic guess lights near them
//   · same real person → same star all week (ask-stacking flags keep their meaning);
//     recurring company meetings share one "champion" star
//   · titles keep their structure; name-less entries get an attendee chip instead
// Real names are swapped for placeholders before scrubbing, so nothing real survives.

const BARE = ["Tom", "Tony", "Nathan", "Mark", "Ira", "Jenn", "Levi", "Sam", "Greg", "Jeff", "Steve", "Eddi", "Jeremy",
  "Adella", "Sara", "Roberto", "Gabe", "Michael", "Vinay", "John", "Wes", "Patrick", "Luke", "Rob", "Ben"];
const UNKNOWN = /isn't in (the|my) files|not in the capsule|thin file|cut off on the calendar|No name on the invite|no role on file|Roster has an? |confirm it's the same person/i;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function castMeetings({ MEETINGS, PEOPLE, frags, V, norm, mapName, swapCal, embed }) {
  // ---- star centroids ----
  const D = V.values().next().value.length;
  const byKey = new Map(PEOPLE.map((p, i) => [norm(p.name), i]));
  const acc = PEOPLE.map(() => new Float64Array(D));
  for (const f of frags) {
    if (!f.addressed) continue;
    const i = byKey.get(norm(f.addressed)), v = V.get(f.id);
    if (i === undefined || !v) continue;
    for (let j = 0; j < D; j++) acc[i][j] += v[j];
  }
  const cent = acc.map(c => { const L = Math.hypot(...c) || 1; return Array.from(c, x => x / L); });
  const dot = (a, b) => { let s = 0; for (let j = 0; j < D; j++) s += a[j] * b[j]; return s; };

  // ---- slots: who needs a star in each meeting ----
  const realStar = (m, c) => m.ppl.find(pi => {
    const k = norm(PEOPLE[pi].name), ck = norm(c);
    return k === ck || (k.split(" ")[0] === ck.split(" ")[0] && k.includes(ck.split(" ").pop()));
  });
  const used = new Set(MEETINGS.flatMap(m => m.ppl)); // real stars keep their own identity
  const cast = new Map(); // slot key → star index
  const plan = MEETINGS.map((m, i) => {
    const personal = m.kind === "personal";
    const title = personal ? "Coffee catch-up" : m.title;
    const slots = [];
    for (const c of m.contacts || []) {
      const rs = realStar(m, c);
      slots.push(rs !== undefined ? { key: "star:" + rs, star: rs, real: c } : { key: "p:" + norm(c), real: c });
    }
    const firsts = new Set((m.contacts || []).map(c => c.split(" ")[0]));
    for (const b of BARE) if (new RegExp("\\b" + b + "\\b").test(title) && !firsts.has(b)) slots.push({ key: "b:" + b, bare: b });
    const trunc = title.match(/[—-] ([A-Z][a-z]?)…/);
    if (trunc) slots.push({ key: "t:" + i, trunc: trunc[0] });
    if (!slots.length) slots.push({ key: m.co && m.co.length ? "co:" + m.co[0].name : "m:" + i, chip: true });
    return { m, i, title, personal, slots };
  });

  // ---- relevance: embed each meeting's name-free text, cast best unused star ----
  const nameRe = (m) => new RegExp("\\b(" + [...(m.contacts || []), ...BARE].map(esc).join("|") + ")\\b", "g");
  const texts = plan.map(p => ([p.title, p.personal ? "" : p.m.prep, p.m.co && p.m.co.map(c => c.name).join(" ")].filter(Boolean).join(". ").replace(nameRe(p.m), " ")) || "education meeting");

  const qv = await embed(texts);
  const firstCount = new Map();
  for (const p of PEOPLE) { const f = mapName(p.name).replace(/^(Dr\.|Mr\.|Ms\.)\s+/, "").split(" ")[0]; firstCount.set(f, (firstCount.get(f) || 0) + 1); }
  const ranked = PEOPLE.map((p, i) => i).filter(i => PEOPLE[i].n >= 13); // cast from the visible, well-known stars
  plan.forEach((p, mi) => {
    for (const s of p.slots) {
      if (s.star !== undefined) { cast.set(s.key, s.star); continue; }
      if (cast.has(s.key)) continue;
      let best = -1, bs = -9;
      for (const i of ranked) {
        if (used.has(i) || (s.bare && firstCount.get(mapName(PEOPLE[i].name).replace(/^(Dr\.|Mr\.|Ms\.)\s+/, "").split(" ")[0]) > 1)) continue;
        const v = dot(qv[mi], cent[i]); if (v > bs) { bs = v; best = i; }
      }
      cast.set(s.key, best); used.add(best);
    }
  });

  // ---- week-wide name table: one real person → one star, in every field of every meeting ----
  const demoOf = (pi) => mapName(PEOPLE[pi].name).replace(/^(Dr\.|Mr\.|Ms\.)\s+/, "");
  const table = []; // [regex, replacement name] — full names and surnames apply week-wide
  const seenReal = new Set();
  for (const p of plan) for (const s of p.slots) {
    const demo = demoOf(cast.get(s.key)), [df, ...dl] = demo.split(" ");
    if (s.real && !seenReal.has(s.real)) {
      seenReal.add(s.real);
      const rl = s.real.split(" ").slice(1).join(" ");
      table.push([new RegExp("\\b" + esc(s.real) + "\\b", "g"), demo]);
      if (rl.length > 3) table.push([new RegExp("\\b" + esc(rl) + "\\b", "g"), dl.join(" ")]);
    }
    if (s.bare && !table.some(([r]) => r.source === "\\b" + s.bare + "\\b")) table.push([new RegExp("\\b" + s.bare + "\\b", "g"), df]);
  }
  table.sort((x, y) => y[0].source.length - x[0].source.length); // longest first
  const COMPANIES = [...new Set(MEETINGS.flatMap(m => (m.co || []).map(c => c.name)).concat(["SAM Labs", "Third Space Learning", "Learning Commons"]))];

  // ---- rewrite text through placeholders, scrub, then drop in star names ----
  const starByDemo = new Map(PEOPLE.map((p, i) => [mapName(p.name).replace(/^(Dr\.|Mr\.|Ms\.)\s+/, ""), i]));
  return plan.map(({ m, i, title, personal, slots }) => {
    const fills = [];
    const ph = (name) => { fills.push(name); return `\u0001${fills.length - 1}\u0002`; };
    const fields = { title, prep: personal ? null : m.prep, flag: personal ? null : m.flag, stale: personal ? null : m.stale };
    for (const f of Object.keys(fields)) {
      let v = fields[f];
      if (!v) continue;
      for (const c of COMPANIES) v = v.split(c).join(ph(c)); // company names are never people
      for (const s of slots) { // this meeting's own contacts: truncated forms + first names
        if (!s.real) { if (s.trunc) v = v.replace(s.trunc, () => s.trunc.slice(0, 2) + ph(demoOf(cast.get(s.key)))); continue; }
        const demo = demoOf(cast.get(s.key)), rf = s.real.split(" ")[0];
        v = v.replace(new RegExp("\\b" + esc(rf) + "\\s+[A-Z][\\w'-]*…", "g"), () => ph(demo));
        v = v.replace(new RegExp("\\b" + esc(s.real) + "\\b", "g"), () => ph(demo));
        v = v.replace(new RegExp("\\b" + esc(rf) + "\\b", "g"), () => ph(demo.split(" ")[0]));
      }
      for (const [re, name] of table) v = v.replace(re, () => ph(name));
      fields[f] = v;
    }
    const first = PEOPLE[cast.get(slots[0].key)];
    if (fields.prep && UNKNOWN.test(fields.prep) && slots[0].star === undefined) {
      fields.prep = `${ph(demoOf(cast.get(slots[0].key)))}: ${first.n} mentions in the capsule — click the star to see what you've talked about.`;
    }
    const out = {};
    for (const [f, v] of Object.entries(fields)) out[f] = v == null ? v : swapCal(v).replace(/\u0001(\d+)\u0002/g, (_, k) => fills[+k]);
    const ppl = [...new Set(slots.map(s => cast.get(s.key)))];
    // any star named in full anywhere in the entry is part of it (e.g. "this is X's world")
    const text = [out.title, out.prep, out.flag, out.stale].filter(Boolean).join(" ");
    for (const [name, pi] of starByDemo) if (name.includes(" ") && text.includes(name) && !ppl.includes(pi)) ppl.push(pi);
    return { ...m, ...out, kind: personal ? "intro" : m.kind, ppl, contacts: ppl.map(pi => mapName(PEOPLE[pi].name)) };
  });
}
