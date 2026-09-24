// Builds the guided-demo Observatory: an exact copy of the real one with every
// person's name replaced by a consistent pseudonym. Vectors, positions, roles,
// dates, links, prep notes — all unchanged. Jacob and Kunal stay real (they present).
//   node build_demo.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Volumes/LaCie/jacobs brain v2";
const REAL_CAP = path.join(ROOT, "tools/voiceprint/jacob-capsule");
const DEMO_CAP = path.join(ROOT, "tools/voiceprint/demo-capsule");
const HERE = import.meta.dirname;

// ---------- pools ----------
const FIRST = `Avery Blake Cameron Dana Ellis Finley Harper Jordan Kendall Logan Morgan Parker Quinn Reese Rowan Sawyer Skyler Taylor Emerson Hayden
Adrian Bianca Calvin Delia Everett Fiona Gideon Helena Ignacio Juliet Kieran Lorena Marcus Nadia Oscar Priya Ronan Simone Tobias Vera
Wesley Yara Zane Alma Bram Celeste Dorian Esme Felix Greta Hugo Ines Jasper Lila Milo Nora Otto Paloma Rafael Sylvie Theo Uma Vance Wren
Anika Beau Clara Desmond Elena Frida Gus Hollis Ivy Jonah Kai Leona Mateo Nell Orion Pilar Reid Sasha Tamsin Ulric Violet Willa Xavier Zora
Arlo Bea Cyrus Dashiell Eloise Flynn Gemma Hank Imogen Jude Kit Lucian Marguerite Nico Odette Piers Rhea Soren Thea Vivian Wilder Yusuf`.split(/\s+/);
const LAST_SEED = `Ashcroft Bellamy Carraway Dunmore Eastwick Fairbanks Galloway Hartwell Ingram Jessup Kingsley Lockhart Marchetti Northrup Oakes
Pemberton Quill Ravenscroft Sterling Thornbury Underhill Vance Whitlock Yardley Ashby Blackwood Calloway Devereaux Ellsworth Fenwick
Greenleaf Holloway Ironside Jarrow Kestrel Lindqvist Moncrief Nightingale Oberon Prescott Redfern Sandoval Thistlewood Vasquez Winslow
Abernathy Bridgewater Castellano Dunleavy Everhart Farrow Gilchrist Hawthorne Isherwood Kavanagh Lethbridge Merriweather Norwood Okafor
Pennington Rourke Stavros Tennyson Upton Vandermeer Wexler Yeats Aldridge Bexley Crane Dalloway Emberly Fitzwilliam Granger Hollister
Ivory Juniper Kendrick Lowell Mabry Nakamura Ortega Pryor Quimby Rasmussen Sinclair Tremont Vail Wakefield Zellner Ambrose Beckett Colby
Draper Ferris Garland Haskell Ivers Jenning Larkin Mercer Nash Osgood Paxton Rennick Sutter Tate Verlaine Whitcombe Yale Zimmer`.split(/\s+/);
const LAST = [...LAST_SEED];
for (const a of ["Ash", "Black", "Brook", "Clear", "Cold", "Dun", "East", "Fair", "Green", "Hart", "High", "Holm", "King", "Lang", "Marsh", "North", "Oak", "Red", "Stone", "Thorn", "West", "White", "Wind", "Wood", "Gold", "Silver", "Bright", "Lock", "Winter", "Summer"])
  for (const b of ["worth", "more", "field", "ley", "wick", "bury", "ridge", "well", "croft", "hurst", "stead", "combe", "gate", "mere", "shaw", "bourne", "dale", "wright"])
    LAST.push(a + b);
FIRST.push(...`Ansel Brielle Corin Davina Enzo Farah Galen Hattie Idris Jolene Kasper Liesl Maren Nils Ophelia Pascal Ramona Silas Tallis Ulla Vidal Wynne Xiomara Yannick Zelda
Amara Booker Cressida Dax Elowen Fritz Giselle Hamish Isolde Jareth Keziah Lorcan Mirabel Nestor Oona Perrin Rosalind Sabine Thaddeus Una Viggo Wilhelmina Yorick Zephyr
Alden Bettina Caspian Delphine Emrys Fenna Gareth Honora Ivo Juno Kellan Leocadia Magnus Ninette Osric Petra Quillon Romilly Stellan Tove Ursula Valentin Winifred Ximena`.split(/\s+/));

const hash = (s) => { let h = 2166136261; for (const c of s.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const HONOR = new Set(["dr", "dr.", "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "prof", "prof.", "coach", "principal", "superintendent", "sen.", "rep."]);
const SUFFIX = new Set(["phd", "ph.d", "ph.d.", "edd", "ed.d", "ed.d.", "med", "m.ed", "m.ed.", "mba", "jr", "jr.", "sr", "sr.", "ii", "iii", "cpa", "esq", "eligible"]);
const STOP_FIRST = new Set(`happy great good thank thanks congrats congratulations love well nice best big huge super way go hi hello hey dear team yes the this that what how wow so very
totally absolutely agreed exactly beautiful brilliant such awesome amazing looking looks proud excited welcome merry cheers keep love loved good morning`.split(/\s+/));
const KEEP = /^((?:jacob\s+kantor(?:\s+eligible)?|kunal\s+dalal)\s*)/i; // presenters stay real

const isTok = (t) => /^[A-Z][A-Za-z'’-]+$/.test(t);
const firstMap = new Map(), lastMap = new Map();
const realFirst = new Set(), realLast = new Set();
function mapName(full) {
  const k = full.match(KEEP);
  if (k) return k[1] + mapName(full.slice(k[1].length)); // "Jacob Kantor Amanda X" → keep Jacob, map the rest
  const toks = full.split(/(\s+)/); // keep whitespace
  let seenFirst = false;
  return toks.map(t => {
    if (!isTok(t) || HONOR.has(t.toLowerCase()) || SUFFIX.has(t.toLowerCase())) return t;
    if (!seenFirst) { seenFirst = true; return fakeFirst(t); }
    return fakeLast(t);
  }).join("");
}
function fakeFirst(t) {
  const k = t.toLowerCase();
  if (!firstMap.has(k)) firstMap.set(k, FIRST[hash("f:" + k) % FIRST.length]);
  return firstMap.get(k);
}
function fakeLast(t) {
  const k = t.toLowerCase();
  if (!lastMap.has(k)) lastMap.set(k, LAST[hash("l:" + k) % LAST.length]);
  return lastMap.get(k);
}

// ---------- gather the real-name dictionary ----------
const frags = fs.readFileSync(path.join(REAL_CAP, "fragments.jsonl"), "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
const words = new Set(fs.readFileSync("/usr/share/dict/words", "utf8").split("\n").map(w => w.toLowerCase()));
const count = new Map();
for (const f of frags) if (f.addressed) count.set(f.addressed, (count.get(f.addressed) || 0) + 1);

const rosterCsv = fs.readFileSync(path.join(ROOT, "raw-data/roster/Cleaned up DODO DOJO HITLIST ver. 2 - Contacts.csv"), "utf8");
const rosterNames = rosterCsv.split("\n").slice(1).map(l => l.split(",")[0].trim()).filter(n => n && n.split(" ").length >= 2);

const obsSrc = fs.readFileSync(path.join(ROOT, "mockups/observatory/data.js"), "utf8");
(0, eval)(obsSrc + ";globalThis.PEOPLE=PEOPLE;globalThis.DUST=DUST;globalThis.MEETINGS=MEETINGS;globalThis.YEAR0=YEAR0;globalThis.YEARS=YEARS;");

// names that appear in the calendar (titles, contacts, prep, flags) — hand-listed from week.js;
// includes bare first names of team/family so nothing real leaks in a live demo
const CAL_NAMES = `Jason Bell|Brad Mason|Whitney Smith|Whittney Smith|Sean Bulson|Jeff Piontek|Rick Fernandez|Steve Iglesias|Steven Iglesias|Kurtis Pake
|Patrick Gittisriboongul|Antonio Vigil|Allen Pratt|Jennifer Womble|Eric Brooks|Mike Lawrence|Chris Hoang|Matt Mallison|Rob Magliano|Dawn Hosni
|Damian Mathe|James Blomfield|Ben Greiner|Jenna Fuentes|Rachael Mann|Steven Pechter|Trisha Thomas|Mario Vasilescu|Dhrew Hannah|Patrick Leonard
|Megan Benay|Kiela Jimenez|Sam W.|Roberto|Eddi|Jeremy|Adella|Ira|Sara|Jenn|Levi|Luke|Gabe|Michael|Vinay|John|Wes|Patrick|Greg|Jeff|Steve
|Piontek|Womble|Pratt|Gittisriboongul|Vigil|Brooks|Iglesias|Pake|Fernandez|Mason|Sanchez|Lawrence|Hoang|Mallison|Bulson`
  .split("|").map(s => s.trim()).filter(Boolean);

const dict = new Set();
for (const [n, c] of count) {
  const toks = n.split(/\s+/);
  if (toks.length < 2 || toks.length > 4) continue;
  if (STOP_FIRST.has(toks[0].toLowerCase())) continue;
  if (!toks.every(t => isTok(t) || HONOR.has(t.toLowerCase()) || SUFFIX.has(t.toLowerCase()))) continue;
  const last = toks[toks.length - 1].toLowerCase();
  if (c >= 2 || !words.has(last)) dict.add(n);
}
for (const n of rosterNames) dict.add(n);
for (const p of PEOPLE) dict.add(p.name);
for (const n of CAL_NAMES) if (n.includes(" ")) dict.add(n);
for (const n of dict) { const t = n.split(/\s+/).filter(isTok); if (t[0]) realFirst.add(t[0].toLowerCase()); for (const x of t.slice(1)) realLast.add(x.toLowerCase()); }
console.log("name dictionary:", dict.size, "| distinct first tokens:", realFirst.size, "| last tokens:", realLast.size);

// keep pools clear of real tokens so a pseudonym never lands on a real person
const FIRST_OK = FIRST.filter(f => !realFirst.has(f.toLowerCase()));
const LAST_OK = LAST.filter(l => !realLast.has(l.toLowerCase()));
FIRST.length = 0; FIRST.push(...FIRST_OK); LAST.length = 0; LAST.push(...LAST_OK);

// stars and calendar names get collision-free pseudonyms; the long tail hashes
FIRST.sort((a, b) => hash("s:" + a) - hash("s:" + b)); LAST.sort((a, b) => hash("s:" + a) - hash("s:" + b)); // deterministic shuffle
const usedF = new Set(), usedL = new Set();
let fi = 0, li = 0;
for (const n of [...PEOPLE.map(p => p.name), ...CAL_NAMES]) {
  if (/^(jacob|kunal)\b/i.test(n)) continue;
  const toks = n.split(/\s+/).filter(t => isTok(t) && !HONOR.has(t.toLowerCase()) && !SUFFIX.has(t.toLowerCase()));
  if (!toks.length) continue;
  const f = toks[0].toLowerCase();
  if (!firstMap.has(f)) { while (fi < FIRST.length && usedF.has(FIRST[fi])) fi++; if (fi < FIRST.length) { firstMap.set(f, FIRST[fi]); usedF.add(FIRST[fi]); } }
  for (const t of toks.slice(1)) { const l = t.toLowerCase(); if (!lastMap.has(l)) { while (li < LAST.length && usedL.has(LAST[li])) li++; if (li < LAST.length) { lastMap.set(l, LAST[li]); usedL.add(LAST[li]); } } }
}
console.log("pools after filtering:", FIRST.length, "first ·", LAST.length, "last | pre-assigned:", firstMap.size, "first ·", lastMap.size, "last");

// ---------- replacement engine ----------
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fullRe = new RegExp("\\b(" + [...dict].sort((a, b) => b.length - a.length).map(esc).join("|") + ")\\b", "g");
const swapFull = (s) => s == null ? s : s.replace(fullRe, (m) => mapName(m));
// calendar-only: also swap bare first/last tokens (team, family, "Piontek deferred", etc.)
const calBare = CAL_NAMES.filter(n => !n.includes(" ") && isTok(n));
const bareRe = new RegExp("\\b(" + calBare.map(esc).join("|") + ")\\b", "gi");
const keepCase = (src, out) => src === src.toUpperCase() ? out.toUpperCase() : out;
const swapCal = (s) => s == null ? s : swapFull(s).replace(bareRe, (m) => keepCase(m, realLast.has(m.toLowerCase()) && !realFirst.has(m.toLowerCase()) ? fakeLast(m) : fakeFirst(m)));

// ---------- demo capsule ----------
fs.mkdirSync(DEMO_CAP, { recursive: true });
let changedFrags = 0;
const outFrags = frags.map(f => {
  const text = swapFull(f.text), addressed = f.addressed ? mapName(f.addressed) : f.addressed;
  if (text !== f.text || addressed !== f.addressed) changedFrags++;
  return { ...f, text, addressed };
});
fs.writeFileSync(path.join(DEMO_CAP, "fragments.jsonl"), outFrags.map(f => JSON.stringify(f)).join("\n"));
const vlink = path.join(DEMO_CAP, "vectors.json");
if (!fs.existsSync(vlink)) fs.symlinkSync("../jacob-capsule/vectors.json", vlink);
fs.writeFileSync(path.join(DEMO_CAP, "README.md"), "Demo capsule: Jacob's real fragments with every name pseudonymized (build_demo.mjs). vectors.json is a symlink to the real capsule — the geometry is identical.\n");
console.log("fragments rewritten:", changedFrags, "of", frags.length);

// ---------- demo data.js ----------
const demoPeople = PEOPLE.map(p => ({ ...p, name: mapName(p.name), note: swapCal(p.note), cal: p.cal.map(swapCal) }));
const demoMeetings = MEETINGS.map(m => ({
  ...m, title: swapCal(m.title), prep: swapCal(m.prep), flag: swapCal(m.flag), stale: swapCal(m.stale),
  contacts: m.contacts.map(mapName),
}));
fs.writeFileSync(path.join(HERE, "data.js"),
  "// Generated by build_demo.mjs — real structure, pseudonymized names. Guided demo only.\n" +
  "const PEOPLE = " + JSON.stringify(demoPeople) + ";\n" +
  "const DUST = " + JSON.stringify(DUST) + ";\n" +
  "const MEETINGS = " + JSON.stringify(demoMeetings) + ";\n" +
  `const YEAR0 = ${YEAR0}, YEARS = ${YEARS};\n`);
console.log("data.js written · sample:", PEOPLE.slice(0, 3).map(p => p.name + " → " + mapName(p.name)).join(" · "));

// leak check: any real star / roster / calendar full name still present anywhere?
const hay = fs.readFileSync(path.join(HERE, "data.js"), "utf8") + fs.readFileSync(path.join(DEMO_CAP, "fragments.jsonl"), "utf8");
const leaks = [...dict].filter(n => !/^(jacob kantor( eligible)?|kunal dalal)$/i.test(n.trim()) && new RegExp("\\b" + esc(n) + "\\b").test(hay));
console.log("leak check — real names still present:", leaks.length, leaks.slice(0, 10));
