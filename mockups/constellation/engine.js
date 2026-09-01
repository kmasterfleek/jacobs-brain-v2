// Scoring + Dojo twin engine. Deterministic, scripted — a mockup of what a
// live model would do, faithful to the matrices-v1 join order:
// relevance → give/ask read → opener fit → reachability → affordability → urgency.

const HEAT_WEIGHT = { hot: 1.15, warm: 1.0, cooling: 0.85, cold: 0.7 };

function overlap(a, b) {
  if (!a.length || !b.length) return 0;
  const hits = a.filter((t) => b.includes(t)).length;
  return hits / b.length;
}

// Best angle for a contact against a company, with component scores.
function matchContact(contact, company) {
  let best = null;
  for (const angle of company.angles) {
    const relevance = Math.max(
      overlap(contact.pain, angle.forWhom),
      overlap(contact.hooks, angle.forWhom)
    );
    const openerFit = contact.style === angle.style ? 1 : 0.55;
    const reach = (contact.access / 5) * 0.6 + (contact.authority / 3) * 0.4;
    let affordability = contact.flags?.paid ? 1 : contact.capacity;
    // give/ask read: high baseline collapses toward ask with no overlap
    const giveRead = (company.giveAsk / 5) * (0.35 + 0.65 * relevance);
    let score =
      (0.38 * relevance + 0.17 * openerFit + 0.2 * reach + 0.15 * affordability + 0.1 * giveRead) *
      (angle.strength / 3) *
      HEAT_WEIGHT[company.heat] *
      (0.55 + 0.45 * affordability); // a depleted contact must not out-rank a charged one
    const warnings = [];
    if (contact.flags?.buildVsBuy) { score *= 0.35; warnings.push("build-vs-buy trap"); }
    if (contact.flags?.noSalesOptics) { score *= 0.4; warnings.push("won’t be seen as a salesperson"); }
    if (contact.flags?.localPref && company.id !== "local") { score *= 0.5; warnings.push("checks for a local alternative first"); }
    if (contact.flags?.domainGate && relevance < 0.3) { score *= 0.2; warnings.push("outside his wheelhouse — domain gate"); }
    if (contact.dormant) { score *= 0.1; warnings.push("dormant 2+ years"); }
    if (contact.hub && contact.openness >= 2) warnings.push("opener — can produce new names");
    if (!best || score > best.score) best = { angle, relevance, openerFit, reach, affordability, giveRead, score, warnings };
  }
  return best;
}

// Predicted relationship cost of the ask, as a fraction of capacity.
// Matched asks cost less; mismatched or gated asks cost more (matrices §join, note 5).
function askCost(contact, company, angle, relevance, openerFit) {
  if (contact.flags?.paid) return 0;
  let base = { 5: 0.12, 4: 0.2, 3: 0.32, 2: 0.45, 1: 0.6 }[contact.access];
  base *= 1.5 - relevance;               // matched-pain asks are nearly free
  base *= openerFit === 1 ? 0.85 : 1.2;  // wrong opener costs extra
  if (contact.flags?.domainGate && relevance < 0.3) base *= 2.2;
  if (contact.flags?.noSalesOptics) base *= 2.0;
  return Math.min(1, base);
}

// ---------------- Dojo twin ----------------
// A rehearsal is: pick angle → pick opener → twin reacts → pick the move →
// twin resolves → verdict. Twin lines are keyed per contact where the voice
// pass gave us a personality; otherwise generated from attributes.

const TWIN_VOICE = {
  "eric-brooks": {
    greet: "Jacob. Got a minute between meetings — what've you got?",
    inLane: "Okay, that's actually my lane. If the research is real, send it over and let's find twenty minutes.",
    offLane: "I'm going to stop you there. That's not my wheelhouse, and you know I don't play outside it. Who else should be hearing this?",
    burned: "…You've come to me twice this month already, Jacob. I'll always take your call, but let's make this one count.",
  },
  "lk-alameda": {
    greet: "Jacob, good to hear from you. How's the family?",
    pitchSmell: "Hm. This is starting to sound like you're selling me something. You know I don't do that — I can't be that person.",
    softLanding: "Now that — framed as research I could quietly pass along — that I can live with. But it stays off the record.",
  },
  "greg-arcadia": {
    greet: "Hey! Was just prototyping something — what's up?",
    builds: "Honestly? I looked at their stack. I could build 80% of that in a weekend. What I *would* take is a technical deep-dive with their engineers.",
  },
  "steve-iglesias": {
    greet: "Jacob! Text me anytime, you know that. Talk to me.",
    yes: "200 schools, so if the math is real, that's a real number for us. Set it up — you know I'll take the meeting.",
  },
  "allen-pratt": {
    greet: "Jacob Kantor. My favorite phone call. What do you need?",
    opens: "You know what — this isn't for me, it's for about forty superintendents I know. Let me make some calls and attach my name to it.",
  },
  "richard-stokes": {
    greet: "Jacob, mate. Bit early there, isn't it?",
    local: "Straight question: is there an Australian outfit doing this? Because that's where I have to start. If not — then let's talk.",
  },
  "kiela-jimenez": {
    greet: "Hi Jacob. Is this a call-sitting engagement? Send the calendar link and the usual rate works.",
    paid: "Confirmed. Invoice follows the call. Who's the company and what do they need me to pressure-test?",
  },
  "kurtis-pake": {
    greet: "Jacob! New office, same me. I'm building my whole slate from scratch over here — good timing.",
    yes: "Honestly, you're catching me at the perfect moment. Send it — I'm saying yes to first meetings this quarter.",
  },
  "jen-womble": {
    greet: "Jacob! I was literally about to text you. Who do you need?",
    opens: "I know exactly who should hear this. Three names, and I'll make the intros myself this week.",
  },
};

const OPENERS = {
  data_first: (a) => `Open with the evidence: “${a.proofPoint}.” Numbers first, story second.`,
  story_first: (a) => `Open with the narrative: what this looks like in a school year from now. Save the proof for question two.`,
  peer_proof_first: () => `Open with who else is already in: name the comparable district and what happened there.`,
  brand_first: () => `Open with the name on the door. Let the brand do the first thirty seconds.`,
  bottom_line_first: () => `Open with the number: what it saves or brings in, in dollars, in the first sentence.`,
};

function buildRehearsal(contact, company, match) {
  const { angle, relevance, openerFit } = match;
  const v = TWIN_VOICE[contact.id] || {};
  const cost = askCost(contact, company, angle, relevance, openerFit);

  // Opener choices: contact's own style, the angle's style, and a generic direct ask.
  const openerChoices = [
    { id: "theirs", label: OPENERS[contact.style](angle), style: contact.style, tag: "matches how they listen" },
    ...(contact.style !== angle.style
      ? [{ id: "angles", label: OPENERS[angle.style](angle), style: angle.style, tag: "matches the angle" }]
      : []),
    { id: "direct", label: "Skip the framing — ask straight for the meeting.", style: "direct", tag: "fastest, costs most" },
  ];

  function respond(openerId) {
    const usedTheirStyle = openerId === "theirs";
    let line, costMult = usedTheirStyle ? 0.85 : openerId === "direct" ? 1.35 : 1.0;
    let outcome = "meeting_likely";

    if (contact.flags?.paid) { line = v.paid || "Send the engagement details — the usual rate."; outcome = "paid_engagement"; costMult = 0; }
    else if (contact.dormant) { line = "(Delivered. The read receipt never comes — same as the last two years.)"; outcome = "dormant"; costMult *= 1.6; }
    else if (contact.flags?.domainGate && relevance < 0.3) { line = v.offLane || "That's outside my lane, and I protect my lane."; outcome = "gated"; costMult *= 2.2; }
    else if (contact.flags?.noSalesOptics && openerId === "direct") { line = v.pitchSmell || "This sounds like selling. I can't be near selling."; outcome = "misfire"; costMult *= 2.0; }
    else if (contact.flags?.noSalesOptics) { line = v.softLanding || "Framed that way, quietly, maybe."; outcome = "fragile_yes"; costMult *= 1.1; }
    else if (contact.flags?.buildVsBuy) { line = v.builds || "I'd probably just build that myself, honestly."; outcome = "builds_it"; costMult *= 1.2; }
    else if (contact.flags?.localPref) { line = v.local || "Is there a local option? That's where I start."; outcome = "conditional"; costMult *= 1.15; }
    else if (contact.capacity < 0.5) { line = v.burned || "You've been coming to me a lot lately, Jacob…"; outcome = "strained"; costMult *= 1.4; }
    else if (relevance >= 0.5 && contact.openness >= 2) { line = v.opens || v.yes || "This is exactly right — and I know three more people who need it."; outcome = "opens_doors"; }
    else if (relevance >= 0.5) { line = v.yes || v.inLane || "That actually lands. Set it up."; outcome = "meeting_likely"; }
    else { line = "I mean… I'll take the meeting because it's you. But this one's a stretch and we both know it."; outcome = "favor_spend"; costMult *= 1.5; }

    return { line, outcome, cost: contact.flags?.paid ? 0 : Math.min(1, cost * costMult) };
  }

  return { greet: v.greet || `${contact.name.split(" ")[0]} picks up on the second ring.`, openerChoices, respond, baseCost: cost };
}

const OUTCOME_META = {
  paid_engagement: { label: "Paid engagement", cls: "good", advice: "Costs money, not capital. Use freely — this instrument doesn't deplete." },
  opens_doors: { label: "Opens doors", cls: "good", advice: "Take the meeting AND the referrals. This is how the 750 grows without LinkedIn archaeology." },
  meeting_likely: { label: "Meeting likely", cls: "good", advice: "Clean ask, fair price. Log it and let the cooldown run." },
  conditional: { label: "Conditional yes", cls: "warn", advice: "Answer the local question honestly before the real meeting, or it dies there." },
  fragile_yes: { label: "Fragile yes", cls: "warn", advice: "Works only framed as research, off the record. One salesy follow-up burns it." },
  strained: { label: "Strained", cls: "warn", advice: "The yes costs double right now. If it can wait for the recharge, wait." },
  favor_spend: { label: "Favor spend", cls: "warn", advice: "They'd say yes for you, not for the fit. That's the expensive kind of yes." },
  builds_it: { label: "Builds it himself", cls: "bad", advice: "Wrong buyer, right friend. Re-aim: ask for a technical read, not a purchase." },
  gated: { label: "Domain gate", cls: "bad", advice: "Do not spend this person here. Ask who *should* hear it — that referral is free." },
  dormant: { label: "Dormant line", cls: "bad", advice: "This channel has been dead for 2+ years. Re-warm with a pure give first — an ask into silence just documents the silence." },
  misfire: { label: "Misfire", cls: "bad", advice: "This framing damages the relationship itself. Abort, or reframe as pure research." },
};
