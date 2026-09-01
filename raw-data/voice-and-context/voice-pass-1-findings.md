# Voice pass 1: extraction and findings

Transcript covers roughly 27 people. Below is what mechanically comes out of
it, then what the transcript reveals that the matrix does not yet have room
for.

Names carry transcription damage and are marked where uncertain. Nothing here
is a final value; it is what a parser would propose for Jacob to confirm.

---

## Extracted rows

| Person | Access | Openness | Referred by | Notes stated |
|---|---|---|---|---|
| Whitney Smith | 4 | ? | Jen Womble | CTO, new, texts, responds right away, takes meetings, not yet close |
| Mike Lawrence | 2 | ? | Wes, Patrick, LACOE | ABC Unified, email only, no text, former conference head (CoSN or CUE) |
| Steve Iglesias | 5 | ? | — | Academica, Miami, 175k students / 200+ schools, texts, takes any meeting |
| Ryan Reeves* | 4 | ? | — | Academica exec director, Nevada, central office, texts, not every call |
| Casey Taylor | 4 | 2? | Tim Taylor | Charter leader, ~3 schools, post-fire committee, charter is her lane |
| *(name lost)* | 4 | **0** | — | Former Alameda County superintendent, super connected, **refuses to look like a salesperson** |
| Maria White | skip | | | counselor |
| Melissa Royal | skip | | | counselor |
| Jeff *(no surname)* | 5 | 3 | — | On Jacob's podcast, knows everybody in Clark County and NYC, former NY superintendent, former Hawaii DOE math/science head |
| Alan Pratt | 5 | 3 | — | Former exec director NREA, 50 states, 10M rural students, texts, takes any meeting |
| Candy | skip | | | |
| Joan Morris | 1 | ? | Candy | Alliance, little relationship |
| Pam | 1 | ? | — | Consultant, former board member, former superintendent, cordial on LinkedIn only |
| Sandra Garcia | 1 | ? | — | Alum Rock, director state/federal, **no response 2+ years** |
| Kila Jimenez | 2 | ? | — | Alum Rock federal/state, **paid $250/hr for company calls**, quiet a few months |
| Mike (Anaheim) | — | | | Former superintendent, **not his contact** |
| Martin Miller | skip | | | |
| Greg | 4 | ? | Patrick | Arcadia Unified, texts anytime, high-end district, **so techie he builds it himself** |
| Tom Gasper | 3 | ? | — | Archdiocese assistant superintendent, ex-St Monica, **owes him** (free tutoring for daughter), slow replies now |
| Eric Brooks | 5 | 2 | — | Arizona DOE, ex-CAO, texts, takes meetings **unless outside his wheelhouse** |
| Antonio | 4 | 2 | Wes, **Kunal** | Aurora Public Schools, techie speaker, texts, **hot target if the product is good** |
| Brett Madden | 3? | 3 | Eric Brooks | ASU, runs all ed tech pilots across their school network, hyperconnected |
| Richard Stokes | 3 | 1 | — | Australian Boarding School Assoc head, **checks for an Australian alternative first** |
| Michelle Watt | 2 | ? | Jen Womble | Arizona, state AI initiatives |
| Rachel Fambro | 1 | 0 | — | Bakersfield, LinkedIn only |
| Curtis Pake | 4 | ? | — | **Just changed districts**, now assistant superintendent, texts, responsive |

\* transcription uncertain

**Yield:** 22 ratable people, 4 instant skips, 1 disowned contact, in a single
sitting. Access depth is inferable for nearly all of them from natural
language alone. Jacob never said a number once.

---

## The design answer

**Do not ask him for scores.** He does not talk in scales, he talks in
evidence: "I have him on text," "responds right away," "haven't seen a
response in two years," "cordial on LinkedIn." That vocabulary maps onto the
access scale cleanly and it is more reliable than a number, because he is
reporting behavior rather than estimating a rating.

The system should extract, propose, and let him correct. Correction is faster
than production and it keeps the judgment his.

---

## What the transcript surfaces that matrices v1 has no room for

Five fields, all stated unprompted, all consequential.

**`reciprocity_mode: paid_consultation`.** He pays Kila Jimenez $250 an hour
to sit on calls with companies. That is not goodwill and it does not deplete
like goodwill. It is a purchased, repeatable, non-depleting ask, and it is a
fundamentally different instrument from every other row in the table.

**`build_vs_buy`.** Greg at Arcadia is high access and high technical
capability, and therefore a poor buyer, because he builds it himself. Access
without buy propensity is a trap the ranking would fall straight into.

**`domain_gate`.** "Unless it's just not in his wheelhouse." "As long as the
product is doing good work." Jacob is describing a filter he applies *to
protect the relationship*. He will not spend Eric Brooks on something outside
his lane. That is ask capacity being managed in real time by hand, and it
belongs in the model as a per-person constraint, not as a global cooldown.

**`local_preference`.** Richard Stokes will look for an Australian equivalent
first. A structural discount on any non-local company for that contact.

**`decay`, stated in gradient.** "Responds right away," "partially responsive,
way way after," "no response in a couple months," "not for two-plus years."
He tracks staleness precisely and narrates it without being asked.

---

## The one protocol fix that matters

**He is answering the inverse of the question we need.**

Every referral he names is *who introduced him to this person*: Jen Womble,
Wes, Patrick, LACOE, Tim Taylor, Candy, Eric Brooks, Kunal. That is the
inbound path, and it is genuinely useful — it names his hubs.

But the routing question is outbound: **who can this person get me to.** He
never answers it, because the transcript did not ask.

Add it explicitly, as its own beat, after the description:

> "Now, forward: who could this person introduce you to?"

Without it the second-degree graph stays a map of how Jacob's network was
built rather than a map of where it can go.

---

## Two validations worth noting

**Jen Womble.** She is the single most-addressed person in thirteen years of
comment data, at 234 mentions. She surfaces twice in the first two minutes of
this transcript as a referral source. Two completely independent sources, one
behavioral and one narrated, agreeing on the same hub. The comment-mention
extraction was the shakiest inference in the pipeline and it just got
corroborated by Jacob's own mouth.

**The two-axis design.** The former Alameda County superintendent is on text,
responsive, deeply connected, and **will not be seen as a salesperson.** High
access, near-zero openness. If those had been collapsed into one score she
would rank as a top target and every ask would misfire. That is the exact
failure the second axis was built to prevent, and it appeared in the first
twenty people.

---

## Immediate cross-check available

His stated latency language can be compared against measured
`median_response_latency` from the message features, for everyone in this
transcript who resolves to a canonical id.

Where they agree, the behavioral model is tracking his perception and can be
extended to the unrated thousands. Where they diverge, that gap is the
perceptual residual, measurable now rather than after a full calibration pass.

---

## Handling notes

**Transcription damage is real and cheap to fix.** LACOE became "Laco," Alum
Rock became "Alam Rock," Bangor became "Banger," CoSN or CUE became "Kosen or
Cali," and one person lost their name entirely. Match fuzzily against
Connections.csv, propose, and require confirmation. Never silently resolve.

**Voice beats the export on employment.** Curtis Pake just changed districts.
LinkedIn does not know yet. When Jacob's spoken account conflicts with
enrichment, his account wins and the enrichment record keeps the old value as
history.

**Surnames are missing on the people closest to him.** Jeff, Greg, Antonio,
Pam, Candy, Patrick, Wes. That is a signal in itself — he does not use last
names for people he actually knows. Resolve from context and confirm.
