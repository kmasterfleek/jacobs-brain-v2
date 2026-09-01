// DODO v2 mockup — demo dataset.
// Sources: voice pass 1 (Jacob's own words), roster CSV (canonical names),
// matrices v1 (scales & angles). Values are proposals for Jacob to correct,
// not truth. This file never leaves the project.

const PAIN_LABELS = {
  special_ed_staffing: "Special-ed staffing",
  budget_shortfall: "Budget shortfall",
  grant_capacity: "Grant capacity",
  math_achievement: "Math achievement",
  literacy: "Literacy",
  chronic_absenteeism: "Chronic absenteeism",
  teacher_retention: "Teacher retention",
  AI_readiness: "AI readiness",
  college_and_career: "College & career",
  devices_and_infrastructure: "Devices & infra",
  MTSS: "MTSS",
  family_engagement: "Family engagement",
  compliance_and_reporting: "Compliance",
  enrollment_decline: "Enrollment decline",
};

const HOOK_LABELS = {
  independent_research: "Independent research",
  brand_partnership: "Brand partnership",
  free_or_funded: "Free / funded",
  peer_district_proof: "Peer-district proof",
  being_first: "Being first",
  hard_cost_savings: "Hard cost savings",
  dollars_in: "Dollars in",
  board_optics: "Board optics",
  teacher_time_saved: "Teacher time saved",
};

const STYLE_LABELS = {
  data_first: "Data first",
  story_first: "Story first",
  peer_proof_first: "Peer proof first",
  brand_first: "Brand first",
  bottom_line_first: "Bottom line first",
};

// cooldown_days by access depth (matrices v1): 5→14, 4→21, 3→45, 2→75, 1→120
const COOLDOWN = { 5: 14, 4: 21, 3: 45, 2: 75, 1: 120 };

// ---- Rated contacts (voice pass 1, names corrected against roster) ----
const CONTACTS = [
  {
    id: "jen-womble", name: "Jen Womble", role: "Conference chair, FETC", org: "FETC", region: "National",
    access: 5, openness: 3, authority: 0, capacity: 0.92, daysSinceAsk: 26,
    pain: ["AI_readiness", "being_first"], hooks: ["brand_partnership", "being_first"], style: "story_first",
    hub: true, referredBy: [],
    note: "Most-addressed person in 13 years of comment data (234 mentions). Named twice in the first two minutes of the voice pass as a referral source. The hub of hubs.",
    activeWith: [],
  },
  {
    id: "jeff-piontek", name: "Jeff Piontek", role: "Former NY supe · former Hawaii DOE math/science head", org: "All Over Us", region: "National",
    access: 5, openness: 3, authority: 1, capacity: 0.85, daysSinceAsk: 9,
    pain: ["math_achievement", "AI_readiness"], hooks: ["being_first", "independent_research"], style: "story_first",
    hub: true, referredBy: [],
    note: "“He was on my podcast. He knows everybody in Clark County and NYC.”",
    activeWith: ["nvidia"],
  },
  {
    id: "allen-pratt", name: "Allen Pratt", role: "Former exec. director, NREA", org: "All Things Rural", region: "National · rural",
    access: 5, openness: 3, authority: 1, capacity: 1.0, daysSinceAsk: 60,
    pain: ["teacher_retention", "devices_and_infrastructure", "grant_capacity"], hooks: ["free_or_funded", "peer_district_proof"], style: "peer_proof_first",
    hub: true, referredBy: [],
    note: "“50 states, 10 million rural students. I can text him. He takes any meeting.” Going unused this month.",
    activeWith: [],
  },
  {
    id: "steve-iglesias", name: "Steve Iglesias", role: "Chief Information Officer", org: "Academica Schools — FL", region: "Florida",
    access: 5, openness: 1, authority: 2, capacity: 0.78, daysSinceAsk: 11,
    pain: ["math_achievement", "college_and_career"], hooks: ["dollars_in", "peer_district_proof"], style: "bottom_line_first",
    referredBy: [],
    note: "“175k students, 200+ schools. I text him, he takes any meeting.”",
    activeWith: ["thirdspace"],
  },
  {
    id: "eric-brooks", name: "Eric Brooks", role: "Arizona DOE · former CAO", org: "Arizona Dept. of Education", region: "Arizona",
    access: 5, openness: 2, authority: 2, capacity: 0.45, daysSinceAsk: 6,
    pain: ["literacy", "MTSS", "compliance_and_reporting"], hooks: ["independent_research", "peer_district_proof"], style: "data_first",
    flags: { domainGate: "Will not absorb asks outside his wheelhouse — literacy, MTSS, state programs. Spending him off-lane damages the relationship itself." },
    referredBy: [],
    note: "“Texts back, takes meetings — unless it’s just not in his wheelhouse.” Asked twice in the last 3 weeks (two different companies). Recharging.",
    activeWith: ["thirdspace", "zen"],
  },
  {
    id: "kurtis-pake", name: "Kurtis Pake", role: "Administrator", org: "Bangor Township Schools", region: "Michigan",
    access: 3, openness: 1, authority: 2, capacity: 0.9, daysSinceAsk: 90,
    pain: ["devices_and_infrastructure", "teacher_retention"], hooks: ["peer_district_proof", "teacher_time_saved"], style: "story_first",
    referredBy: [],
    note: "Direct line, same-week responses. (Run the ● Voice pass demo — this record is about to be wrong.)",
    activeWith: [],
  },
  {
    id: "whitney-smith", name: "Whitney Smith", role: "CTO", org: "New Jersey district", region: "New Jersey",
    access: 4, openness: 1, authority: 2, capacity: 0.9, daysSinceAsk: 30,
    pain: ["devices_and_infrastructure", "AI_readiness"], hooks: ["being_first", "brand_partnership"], style: "data_first",
    referredBy: ["jen-womble"],
    note: "“New CTO. Texts, responds right away, takes meetings. Not yet close.”",
    activeWith: [],
  },
  {
    id: "greg-arcadia", name: "Greg", role: "CTO", org: "Arcadia Unified", region: "California",
    access: 4, openness: 1, authority: 2, capacity: 0.95, daysSinceAsk: 40,
    pain: ["AI_readiness", "devices_and_infrastructure"], hooks: ["being_first"], style: "data_first",
    flags: { buildVsBuy: "So technical he builds it himself. High access, low buy propensity — a trap the ranking must not fall into." },
    referredBy: ["patrick"],
    note: "“I can text Greg anytime. High-end district. But he’s so techie he builds it himself.”",
    activeWith: [],
  },
  {
    id: "antonio-vigil", name: "Antonio Vigil", role: "Ed-tech team · speaker", org: "Aurora Public Schools", region: "Colorado",
    access: 4, openness: 2, authority: 1, capacity: 0.88, daysSinceAsk: 28,
    pain: ["AI_readiness", "devices_and_infrastructure"], hooks: ["being_first", "brand_partnership"], style: "brand_first",
    referredBy: ["wes", "kunal"],
    note: "“Techie, speaks at conferences. Hot target — if the product is good.”",
    activeWith: [],
  },
  {
    id: "ryan-reeves", name: "Ryan Reeves", role: "Executive director", org: "Academica Schools Nevada", region: "Nevada",
    access: 4, openness: 1, authority: 2, capacity: 0.82, daysSinceAsk: 18,
    pain: ["enrollment_decline", "college_and_career"], hooks: ["dollars_in"], style: "bottom_line_first",
    referredBy: [],
    note: "“Central office. Texts — but not every call.”",
    activeWith: [],
  },
  {
    id: "casey-taylor", name: "Casey Taylor", role: "Executive director", org: "Achieve Charter — Paradise", region: "California",
    access: 4, openness: 2, authority: 2, capacity: 0.9, daysSinceAsk: 34,
    pain: ["enrollment_decline", "family_engagement"], hooks: ["free_or_funded", "peer_district_proof"], style: "story_first",
    referredBy: ["tim-taylor"],
    note: "“Charter leader, ~3 schools, on the post-fire rebuild committee. Charter is her lane.”",
    activeWith: [],
  },
  {
    id: "lk-alameda", name: "L.K.", role: "Former county superintendent", org: "Alameda COE", region: "California",
    access: 4, openness: 0, authority: 1, capacity: 0.95, daysSinceAsk: 55,
    pain: ["literacy", "chronic_absenteeism"], hooks: ["independent_research"], style: "data_first",
    flags: { noSalesOptics: "Refuses to look like a salesperson. Any ask that smells like selling misfires — permanently. High access, zero openness: the exact case the two-axis design exists for." },
    referredBy: [],
    note: "“Super connected — and will not be seen as a salesperson.” Terminal node by choice.",
    activeWith: [],
  },
  {
    id: "brent-maddin", name: "Brent Maddin", role: "Runs ed-tech pilots across the school network", org: "ASU Pilot Schools", region: "Arizona",
    access: 3, openness: 3, authority: 2, capacity: 0.85, daysSinceAsk: 20,
    pain: ["AI_readiness", "teacher_retention", "being_first"], hooks: ["independent_research", "being_first"], style: "data_first",
    hub: true, referredBy: ["eric-brooks"],
    note: "“Hyperconnected. Runs all the ed-tech pilots across their network.”",
    activeWith: [],
  },
  {
    id: "thom-gasper", name: "Thom Gasper", role: "Assistant superintendent", org: "Archdiocese", region: "California",
    access: 3, openness: 1, authority: 2, capacity: 0.6, daysSinceAsk: 95,
    pain: ["enrollment_decline", "literacy"], hooks: ["free_or_funded"], style: "story_first",
    referredBy: [],
    note: "“He owes me — I got his daughter free tutoring. But replies are slow lately.” An asset going stale.",
    activeWith: [],
  },
  {
    id: "richard-stokes", name: "Richard Stokes", role: "CEO", org: "Australian Boarding Schools Assn.", region: "Australia",
    access: 3, openness: 1, authority: 2, capacity: 0.9, daysSinceAsk: 70,
    pain: ["teacher_retention", "family_engagement"], hooks: ["peer_district_proof"], style: "peer_proof_first",
    flags: { localPref: "Checks for an Australian alternative first. Structural discount on any non-local company." },
    referredBy: [],
    note: "“He’ll look for an Australian equivalent before anything else.”",
    activeWith: [],
  },
  {
    id: "candy-navarro", name: "Candy Navarro", role: "District office", org: "Alliance Charter Schools", region: "California",
    access: 3, openness: 2, authority: 1, capacity: 0.9, daysSinceAsk: 50,
    pain: ["college_and_career"], hooks: ["peer_district_proof"], style: "peer_proof_first",
    referredBy: [],
    note: "Referral source — she produced Jeanyll Morris. Quiet connector.",
    activeWith: [],
  },
  {
    id: "kiela-jimenez", name: "Kiela Jimenez", role: "Director, state & federal programs", org: "Alum Rock Union SD", region: "California",
    access: 2, openness: 1, authority: 1, capacity: 1.0, daysSinceAsk: 100,
    pain: ["compliance_and_reporting", "grant_capacity"], hooks: ["dollars_in"], style: "bottom_line_first",
    flags: { paid: "$250/hr to sit on company calls. A purchased, repeatable, non-depleting instrument — a different asset class from goodwill. Asks here cost money, not capital." },
    referredBy: [],
    note: "“I pay her $250 an hour to sit on calls.” Quiet a few months.",
    activeWith: [],
  },
  {
    id: "mike-lawrence", name: "Mike Lawrence", role: "CTO · former conference head (CoSN/CUE)", org: "ABC Unified", region: "California",
    access: 2, openness: 1, authority: 2, capacity: 0.8, daysSinceAsk: 65,
    pain: ["devices_and_infrastructure", "AI_readiness"], hooks: ["peer_district_proof"], style: "peer_proof_first",
    referredBy: ["wes", "patrick"],
    note: "“Email only, no text.”",
    activeWith: [],
  },
  {
    id: "michelle-watt", name: "Michelle Watt", role: "State AI initiatives", org: "AZ Institute of Education & Economy", region: "Arizona",
    access: 2, openness: 1, authority: 1, capacity: 0.85, daysSinceAsk: 45,
    pain: ["AI_readiness"], hooks: ["being_first", "brand_partnership"], style: "brand_first",
    referredBy: ["jen-womble"],
    note: "Arizona, state-level AI work. Warm professional — email lands.",
    activeWith: [],
  },
  {
    id: "jeanyll-morris", name: "Jeanyll Morris", role: "Director of enrollment", org: "Alliance College-Ready", region: "California",
    access: 1, openness: 1, authority: 1, capacity: 0.95, daysSinceAsk: 120,
    pain: ["enrollment_decline"], hooks: ["peer_district_proof"], style: "peer_proof_first",
    referredBy: ["candy-navarro"],
    note: "“Little relationship” — met through Candy.",
    activeWith: [],
  },
  {
    id: "pam-gh", name: "Pam Gildersleeve-Hernandez", role: "Consultant · former supe & board member", org: "Almond Acres Charter", region: "California",
    access: 1, openness: 1, authority: 0, capacity: 0.9, daysSinceAsk: 150,
    pain: ["grant_capacity"], hooks: ["independent_research"], style: "data_first",
    referredBy: [],
    note: "“Cordial on LinkedIn only.”",
    activeWith: [],
  },
  {
    id: "sandra-garcia", name: "Sandra Garcia", role: "Director, state & federal programs", org: "Alum Rock Union SD", region: "California",
    access: 1, openness: 0, authority: 1, capacity: 0.1, daysSinceAsk: 780,
    pain: ["compliance_and_reporting"], hooks: [], style: "data_first",
    dormant: true, referredBy: [],
    note: "“No response in two-plus years.” Dormant, not dead — but treat as unreachable until re-warmed.",
    activeWith: [],
  },
  {
    id: "rayshell-fambrough", name: "Rayshell Fambrough", role: "—", org: "Bakersfield City SD", region: "California",
    access: 1, openness: 0, authority: 0, capacity: 0.9, daysSinceAsk: 200,
    pain: ["chronic_absenteeism"], hooks: [], style: "story_first",
    referredBy: [],
    note: "“LinkedIn only.” Terminal node.",
    activeWith: [],
  },
  // Referrer hubs Jacob names by first name only — "he does not use last names
  // for people he actually knows" (voice pass, handling notes)
  {
    id: "wes", name: "Wes", role: "Referrer hub", org: "—", region: "California",
    access: 4, openness: 3, authority: 0, capacity: 0.9, daysSinceAsk: 30,
    pain: [], hooks: [], style: "story_first", hub: true, referredBy: [],
    note: "Named as the inbound path for Mike Lawrence and Antonio. First-name-only: a closeness signal, not sloppiness.",
    activeWith: [],
  },
  {
    id: "patrick", name: "Patrick", role: "Referrer hub", org: "—", region: "California",
    access: 4, openness: 3, authority: 0, capacity: 0.9, daysSinceAsk: 30,
    pain: [], hooks: [], style: "story_first", hub: true, referredBy: [],
    note: "Named as the inbound path for Greg and Mike Lawrence.",
    activeWith: [],
  },
  {
    id: "tim-taylor", name: "Tim Taylor", role: "Referrer", org: "—", region: "California",
    access: 3, openness: 2, authority: 0, capacity: 0.9, daysSinceAsk: 45,
    pain: [], hooks: [], style: "story_first", referredBy: [],
    note: "Inbound path for Casey Taylor.",
    activeWith: [],
  },
];

// ---- Unrated outer field — real roster rows, no judgment attached yet.
// Low activity is NOT low value: these render as "unknown", never as "dim".
const UNRATED = [
  ["Sito Narcisse", "Former supe", "Baton Rouge Parish"],
  ["Ryan Smith", "Asst. supe", "Bellflower USD"],
  ["Matthew Woods", "—", "Berkeley County Schools"],
  ["Ben Johnson", "—", "Bismarck Schools"],
  ["Mikayle Goss", "Superintendent", "Boles ISD"],
  ["Heather Golly", "Exec. dir., ed services", "Bonsall USD"],
  ["Thomas Nunez", "Administrator", "Brawley Union HSD"],
  ["Sequoyah Wharton", "Educator", "Brentwood UFSD"],
  ["Scott Nanik", "Superintendent", "Bret Harte UHSD"],
  ["Glenn Robbins", "Superintendent", "Brigantine"],
  ["Angela Fulton", "—", "Broward Schools"],
  ["Jordyn Ward", "—", "Bulloch Academy"],
  ["Todd Dugan", "Superintendent", "Bunker Hill CUSD"],
  ["Jacob Carr", "—", "Butte COE"],
  ["Shirley Williams", "Admin", "Butte COE"],
  ["Karen Minshew", "Asst. superintendent", "Cajon Valley USD"],
  ["Rachael Maves", "CDE", "California Dept. of Education"],
  ["Mike Walsh", "Former state president", "CA School Boards Assn."],
  ["Erik Ellefsen", "—", "Baylor University"],
  ["Sonia Ryan", "—", "Bentley School"],
  ["Maria White", "Counselor", "Alemany"],
  ["Melissa Royal", "Counselor", "Alverno"],
  ["Martin Miller", "—", "Antwerp Public Schools"],
  ["Kristina M.", "CDE", "California Dept. of Education"],
];

// ---- Companies (matrices v1, worked examples) ----
const COMPANIES = [
  {
    id: "thirdspace", name: "Third Space Learning", hue: "#3987e5",
    giveAsk: 4, proof: 3, dollar: "brings_in", day: 38, heat: "warm",
    buyerFit: ["district_cabinet", "superintendent", "county"],
    angles: [
      {
        id: "tsl-a", name: "Free math tutoring — Stanford & Cornell studied, Gates funded",
        forWhom: ["math_achievement", "independent_research", "free_or_funded"],
        style: "data_first", strength: 3,
        proofPoint: "Named-institution efficacy research, fully funded seats",
      },
      {
        id: "tsl-b", name: "Prove efficacy on a small cohort, then scale on your terms",
        forWhom: ["being_first", "board_optics"],
        style: "story_first", strength: 2,
        proofPoint: "Pilot-first structure, district keeps control of the narrative",
      },
    ],
  },
  {
    id: "zen", name: "Zen Educate", hue: "#d95926",
    giveAsk: 2, proof: 2, dollar: "saves_hard_cost", day: 12, heat: "hot",
    buyerFit: ["district_cabinet", "superintendent"],
    angles: [
      {
        id: "zen-a", name: "Half a million to a million off special-ed staffing fees",
        forWhom: ["special_ed_staffing", "budget_shortfall", "hard_cost_savings"],
        style: "bottom_line_first", strength: 3,
        proofPoint: "Hard-dollar displacement of agency staffing spend",
      },
      {
        id: "zen-b", name: "Fill the vacancies you already can't fill, without the agency markup",
        forWhom: ["teacher_retention", "special_ed_staffing"],
        style: "peer_proof_first", strength: 2,
        proofPoint: "Live fill-rate data from comparable districts",
      },
    ],
  },
  {
    id: "nvidia", name: "NVIDIA-backed · K-12 AI", hue: "#199e70",
    giveAsk: 4, proof: 1, dollar: "cost_neutral", day: 64, heat: "cooling",
    buyerFit: ["district_cabinet", "county", "state"],
    angles: [
      {
        id: "nv-a", name: "NVIDIA is putting real money into K-12 — and there's a seat at the table",
        forWhom: ["AI_readiness", "brand_partnership", "being_first"],
        style: "brand_first", strength: 3,
        proofPoint: "The brand itself, plus funded participation",
      },
      {
        id: "nv-b", name: "Higher-ed-grade AI tooling coming down to K-12, free to participate",
        forWhom: ["free_or_funded", "AI_readiness"],
        style: "story_first", strength: 2,
        proofPoint: "No-cost pilot cohort forming now",
      },
    ],
  },
];

// ---- Voice-pass demo script (the AI-native input loop) ----
const VOICE_DEMO = {
  transcript:
    "“Oh — and Kurtis. Kurtis Pake. He just moved, he’s assistant superintendent at a new district now. He’s been texting me back same day since he landed. New seat, he’s building his slate from scratch… that window's open right now.”",
  diff: {
    contactId: "kurtis-pake",
    changes: [
      { field: "Org", from: "Bangor Township Schools", to: "New district (per Jacob — LinkedIn not yet updated)" },
      { field: "Access depth", from: "3 · direct line", to: "4 · “texts back same day”" },
      { field: "Ask capacity", from: "resets", to: "full — new-seat window flagged" },
    ],
  },
};
