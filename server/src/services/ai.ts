import type {
  Challenge,
  ChallengeCluster,
  IndustryPartner,
  KnowledgeItem,
  Person,
  Priority,
  University,
} from "../db/schema.js";
import { districtDistanceKm } from "./districts.js";

/* ------------------------------------------------------------------ */
/* Taxonomy                                                            */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  "Water",
  "Healthcare",
  "Agriculture",
  "Infrastructure",
  "Education",
  "Environment",
  "Energy",
  "Sanitation",
  "Livelihood",
] as const;
export type Category = (typeof CATEGORIES)[number];

type Rule = { category: Category; subTag: string; keywords: string[]; expertise: string[] };

const RULES: Rule[] = [
  { category: "Water", subTag: "Drinking Water Scarcity", keywords: ["handpump", "hand pump", "dries up", "dry up", "water shortage", "no water", "drinking water", "borewell", "well dry", "tanker", "groundwater", "water scarcity", "paani", "pani"], expertise: ["Groundwater", "Hydrology", "Civil Engineering", "Water Management", "Rainwater Harvesting"] },
  { category: "Water", subTag: "Water Quality", keywords: ["fluoride", "arsenic", "contaminated", "dirty water", "yellow water", "iron in water", "water quality", "turbid"], expertise: ["Water Quality", "Environmental Engineering", "Chemistry", "Filtration"] },
  { category: "Agriculture", subTag: "Irrigation", keywords: ["irrigation", "canal", "crop water", "drip", "sprinkler", "farm water", "paddy water"], expertise: ["Agricultural Engineering", "Irrigation", "Soil Science", "Water Management"] },
  { category: "Agriculture", subTag: "Crop Loss & Yield", keywords: ["crop failure", "pest", "yield", "seed", "fertilizer", "crop loss", "drought crop", "kharif", "rabi", "farmers"], expertise: ["Agronomy", "Plant Protection", "Soil Science", "Agricultural Engineering"] },
  { category: "Agriculture", subTag: "Post-Harvest & Storage", keywords: ["cold storage", "storage", "spoil", "rotting", "market price", "mandi", "post-harvest"], expertise: ["Food Technology", "Agricultural Engineering", "Supply Chain"] },
  { category: "Healthcare", subTag: "Rural Health Access", keywords: ["hospital", "doctor", "clinic", "phc", "ambulance", "medicine", "health centre", "health center", "pregnant", "maternal", "malaria", "fever", "vaccination"], expertise: ["Public Health", "Biomedical Engineering", "Telemedicine", "Community Medicine"] },
  { category: "Healthcare", subTag: "Nutrition", keywords: ["malnutrition", "anganwadi", "underweight", "nutrition", "anaemia", "anemia"], expertise: ["Public Health", "Nutrition", "Food Technology"] },
  { category: "Infrastructure", subTag: "Rural Roads & Connectivity", keywords: ["road", "bridge", "culvert", "pothole", "cut off", "monsoon road", "no road", "connectivity"], expertise: ["Civil Engineering", "Structural Engineering", "Transportation"] },
  { category: "Infrastructure", subTag: "Digital Connectivity", keywords: ["mobile network", "internet", "signal", "no network", "broadband", "wifi"], expertise: ["Computer Science", "Electronics & Communication", "IoT"] },
  { category: "Education", subTag: "School Infrastructure", keywords: ["school", "classroom", "teacher", "students", "dropout", "blackboard", "smart class", "library"], expertise: ["Education Technology", "Computer Science", "Social Sciences"] },
  { category: "Environment", subTag: "Mining & Pollution", keywords: ["mining", "coal dust", "pollution", "smoke", "air quality", "fly ash", "dust"], expertise: ["Environmental Engineering", "Mining Engineering", "Environmental Science"] },
  { category: "Environment", subTag: "Forest & Wildlife", keywords: ["elephant", "forest", "deforestation", "wildlife", "human-animal conflict", "trees cut"], expertise: ["Environmental Science", "Forestry", "IoT", "Computer Science"] },
  { category: "Environment", subTag: "Waste Management", keywords: ["garbage", "waste", "plastic", "dump", "littering", "solid waste"], expertise: ["Environmental Engineering", "Civil Engineering", "Waste Management"] },
  { category: "Energy", subTag: "Electricity Access", keywords: ["electricity", "power cut", "no power", "solar", "bijli", "load shedding", "transformer", "street light"], expertise: ["Electrical Engineering", "Renewable Energy", "Solar"] },
  { category: "Sanitation", subTag: "Toilets & Drainage", keywords: ["toilet", "open defecation", "drain", "sewage", "waterlogging", "sanitation", "flooding street"], expertise: ["Civil Engineering", "Environmental Engineering", "Public Health"] },
  { category: "Livelihood", subTag: "Employment & Skills", keywords: ["unemployment", "jobs", "migration", "skill", "self help group", "shg", "handicraft", "income", "livelihood"], expertise: ["Management", "Social Sciences", "Rural Development", "Entrepreneurship"] },
];

const URGENCY_TERMS = [
  "emergency", "death", "died", "dying", "disease", "outbreak", "cholera", "diarrhoea", "diarrhea",
  "collapse", "collapsed", "accident", "unsafe", "danger", "dangerous", "life threatening", "children sick",
  "no alternative", "completely dry", "no water at all", "starving", "fire", "flood",
];

const VULNERABLE_TERMS: Record<string, string[]> = {
  "Children": ["children", "child", "kids", "school children", "infants"],
  "Women": ["women", "pregnant", "mothers", "girls"],
  "Elderly": ["elderly", "old people", "senior"],
  "Tribal communities": ["tribal", "adivasi", "pvtg", "santhal", "munda", "oraon", "ho tribe"],
  "Persons with disabilities": ["disabled", "disability", "handicapped"],
};

const GOVT_PRIORITY_SECTORS: Category[] = ["Water", "Healthcare", "Agriculture"];

/* ------------------------------------------------------------------ */
/* Classification                                                      */
/* ------------------------------------------------------------------ */

export type Classification = {
  category: Category;
  subTags: string[];
  urgencyKeywords: string[];
  vulnerableGroups: string[];
  requiredExpertise: string[];
  summary: string;
  frequencyHint: "constant" | "seasonal" | "occasional";
  alternativeHint: boolean | null;
};

export function classifyChallenge(title: string, description: string, forcedCategory?: string): Classification {
  const text = `${title} ${description}`.toLowerCase();
  const scores = new Map<Rule, number>();
  for (const rule of RULES) {
    let s = 0;
    for (const kw of rule.keywords) if (text.includes(kw)) s += kw.includes(" ") ? 2 : 1;
    if (s > 0) scores.set(rule, s);
  }
  let ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r);
  if (forcedCategory && CATEGORIES.includes(forcedCategory as Category)) {
    const inCat = ranked.filter((r) => r.category === forcedCategory);
    ranked = inCat.length ? inCat : RULES.filter((r) => r.category === forcedCategory).slice(0, 1);
  }
  const primary = ranked[0] ?? RULES.find((r) => r.category === "Infrastructure")!;
  const subTags = [...new Set(ranked.filter((r) => r.category === primary.category).map((r) => r.subTag))].slice(0, 3);
  const requiredExpertise = [...new Set(ranked.filter((r) => r.category === primary.category).flatMap((r) => r.expertise))].slice(0, 6);

  const urgencyKeywords = URGENCY_TERMS.filter((t) => text.includes(t));
  const vulnerableGroups = Object.entries(VULNERABLE_TERMS)
    .filter(([, terms]) => terms.some((t) => text.includes(t)))
    .map(([g]) => g);

  let frequencyHint: Classification["frequencyHint"] = "occasional";
  if (/(every summer|every year|seasonal|each summer|every monsoon|annually)/.test(text)) frequencyHint = "seasonal";
  if (/(every day|daily|always|permanent|constant|throughout the year|whole year)/.test(text)) frequencyHint = "constant";

  let alternativeHint: boolean | null = null;
  if (/(no alternative|no other source|only source|nearest .* km|walk .* km)/.test(text)) alternativeHint = false;
  if (/(another source|other well|alternative source|nearby river)/.test(text)) alternativeHint = true;

  const summary = `${primary.category} issue (${primary.subTag}) reported: ${title.trim()}.`;

  return { category: primary.category, subTags: subTags.length ? subTags : [primary.subTag], urgencyKeywords, vulnerableGroups, requiredExpertise, summary, frequencyHint, alternativeHint };
}

export function expertiseForCategory(category: string, subTags: string[]): string[] {
  const rules = RULES.filter((r) => r.category === category && (subTags.length === 0 || subTags.includes(r.subTag)));
  const fallback = RULES.filter((r) => r.category === category);
  return [...new Set((rules.length ? rules : fallback).flatMap((r) => r.expertise))];
}

/* ------------------------------------------------------------------ */
/* Priority (rule-based, explainable)                                  */
/* ------------------------------------------------------------------ */

export type PriorityInput = {
  category: string;
  affectedPopulation: number;
  hasAlternative: boolean;
  frequency: string;
  vulnerableGroups: string[];
  urgencyKeywords: string[];
  clusterSize: number;
  clusterDistricts: number;
  firstReportedAt?: Date;
};

export function computePriority(input: PriorityInput): { priority: Priority; reasons: string[]; points: number } {
  const reasons: string[] = [];
  let points = 0;

  if (input.affectedPopulation >= 5000) { points += 3; reasons.push(`Large population affected (${input.affectedPopulation.toLocaleString("en-IN")} people)`); }
  else if (input.affectedPopulation >= 1000) { points += 2; reasons.push(`Significant population affected (${input.affectedPopulation.toLocaleString("en-IN")} people)`); }
  else if (input.affectedPopulation >= 100) { points += 1; reasons.push(`${input.affectedPopulation.toLocaleString("en-IN")} people affected`); }

  if (input.urgencyKeywords.length) { points += 2; reasons.push(`Urgency signals detected: ${input.urgencyKeywords.slice(0, 3).join(", ")}`); }

  if (!input.hasAlternative) { points += 2; reasons.push("No alternative source or fallback available"); }

  if (input.vulnerableGroups.length) { points += Math.min(2, input.vulnerableGroups.length); reasons.push(`Vulnerable groups affected: ${input.vulnerableGroups.join(", ")}`); }

  if (input.frequency === "constant") { points += 2; reasons.push("Problem occurs constantly"); }
  else if (input.frequency === "seasonal") { points += 1; reasons.push("Problem recurs every season"); }

  if (input.clusterSize >= 10) { points += 3; reasons.push(`Widespread: ${input.clusterSize} locations across ${input.clusterDistricts} district(s) report this problem`); }
  else if (input.clusterSize >= 3) { points += 2; reasons.push(`${input.clusterSize} locations in the region report this problem`); }
  else if (input.clusterSize === 2) { points += 1; reasons.push("One other location reported a similar issue"); }

  if (GOVT_PRIORITY_SECTORS.includes(input.category as Category)) { points += 1; reasons.push(`${input.category} is a government priority sector`); }

  if (input.firstReportedAt) {
    const days = (Date.now() - input.firstReportedAt.getTime()) / 86400000;
    if (days > 90) { points += 1; reasons.push(`Unresolved for over ${Math.floor(days)} days`); }
  }

  let priority: Priority = "Low";
  if (points >= 9) priority = "Critical";
  else if (points >= 6) priority = "High";
  else if (points >= 3) priority = "Medium";
  return { priority, reasons, points };
}

/* ------------------------------------------------------------------ */
/* Clustering                                                          */
/* ------------------------------------------------------------------ */

export function findMatchingCluster(
  candidate: { category: string; subTags: string[]; district: string },
  clusters: ChallengeCluster[],
): ChallengeCluster | undefined {
  return clusters.find(
    (c) =>
      c.category === candidate.category &&
      candidate.subTags.includes(c.subTag) &&
      districtDistanceKm(c.district, candidate.district) <= 90,
  );
}

/* ------------------------------------------------------------------ */
/* University matching                                                 */
/* ------------------------------------------------------------------ */

export type UniversityMatch = { university: University; reasons: string[]; checks: { label: string; ok: boolean }[]; rank: number };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "");
const overlaps = (a: string, b: string) => {
  const x = norm(a), y = norm(b);
  return x.includes(y) || y.includes(x);
};

export function matchUniversities(
  challenge: Pick<Challenge, "category" | "subTags" | "district">,
  universities: University[],
  people: Person[],
  limit = 5,
): UniversityMatch[] {
  const needed = expertiseForCategory(challenge.category, challenge.subTags);
  const results = universities.map((u) => {
    const reasons: string[] = [];
    let score = 0;

    const deptHits = u.departments.filter((d) => needed.some((n) => overlaps(d, n)));
    if (deptHits.length) { score += deptHits.length * 2; reasons.push(`Relevant department: ${deptHits.join(", ")}`); }

    const expHits = u.expertiseTags.filter((t) => needed.some((n) => overlaps(t, n)) || overlaps(t, challenge.category) || challenge.subTags.some((s) => overlaps(t, s)));
    if (expHits.length) { score += expHits.length * 2; reasons.push(`Expertise: ${expHits.slice(0, 4).join(", ")}`); }

    const facultyHits = people.filter((p) => p.universityId === u.id && p.role === "faculty" && p.skills.some((s) => needed.some((n) => overlaps(s, n))));
    if (facultyHits.length) { score += facultyHits.length * 2; reasons.push(`Faculty with matching research: ${facultyHits.map((f) => f.name).slice(0, 3).join(", ")}`); }

    const labHits = u.labs.filter((l) => needed.some((n) => overlaps(l, n)) || overlaps(l, challenge.category) || challenge.subTags.some((s) => l.toLowerCase().includes(s.split(" ")[0].toLowerCase())));
    if (labHits.length) { score += labHits.length * 2; reasons.push(`Laboratory: ${labHits.join(", ")}`); }

    const pastHits = u.pastProjects.filter((p) => overlaps(p, challenge.category) || challenge.subTags.some((s) => p.toLowerCase().includes(s.split(" ")[0].toLowerCase())) || needed.some((n) => overlaps(p, n)));
    if (pastHits.length) { score += pastHits.length * 3; reasons.push(`Previous related project: ${pastHits[0]}`); }

    const km = districtDistanceKm(u.district, challenge.district);
    const near = km <= 120;
    if (near) { score += 2; reasons.push(`Near affected district (${u.district}, ~${Math.round(km)} km)`); }

    const availableStudents = people.filter((p) => p.universityId === u.id && p.role === "student" && p.available).length;
    if (availableStudents > 0) { score += 1; }

    const checks = [
      { label: "Relevant department", ok: deptHits.length > 0 },
      { label: "Matching faculty researcher", ok: facultyHits.length > 0 },
      { label: "Suitable laboratory", ok: labHits.length > 0 },
      { label: "Previous related project", ok: pastHits.length > 0 },
      { label: "Near affected district", ok: near },
      { label: "Students available", ok: availableStudents > 0 },
    ];
    return { university: u, reasons, checks, score };
  });
  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r, i) => ({ university: r.university, reasons: r.reasons, checks: r.checks, rank: i + 1 }));
}

/* ------------------------------------------------------------------ */
/* Team suggestion                                                     */
/* ------------------------------------------------------------------ */

export function suggestTeam(category: string, subTags: string[], people: Person[], universityId: number) {
  const needed = expertiseForCategory(category, subTags);
  const isRelevant = (p: Person) => p.skills.some((s) => needed.some((n) => overlaps(s, n)));
  const pool = people.filter((p) => p.universityId === universityId && p.available);
  const faculty = pool.filter((p) => p.role === "faculty").sort((a, b) => Number(isRelevant(b)) - Number(isRelevant(a)));
  const students = pool.filter((p) => p.role === "student").sort((a, b) => Number(isRelevant(b)) - Number(isRelevant(a)));

  const pick = (list: Person[], n: number) => {
    const out: Person[] = [];
    const seen = new Set<string>();
    for (const p of list) { if (!seen.has(p.department) && out.length < n) { out.push(p); seen.add(p.department); } }
    for (const p of list) { if (out.length < n && !out.includes(p)) out.push(p); }
    return out;
  };
  return { mentors: pick(faculty, 2), students: pick(students, 4), reason: `Team covers ${[...new Set([...pick(faculty, 2), ...pick(students, 4)].map((p) => p.department))].join(", ")} — required expertise: ${needed.slice(0, 4).join(", ")}` };
}

/* ------------------------------------------------------------------ */
/* Industry matching                                                   */
/* ------------------------------------------------------------------ */

export type IndustryMatch = { partner: IndustryPartner; reasons: string[]; rank: number };

export function matchIndustry(project: { category: string; subTags: string[]; district: string }, partners: IndustryPartner[], limit = 4): IndustryMatch[] {
  const needed = expertiseForCategory(project.category, project.subTags);
  return partners
    .map((p) => {
      const reasons: string[] = [];
      let score = 0;
      const focus = p.focusAreas.filter((f) => overlaps(f, project.category) || project.subTags.some((s) => overlaps(f, s)) || needed.some((n) => overlaps(f, n)));
      if (focus.length) { score += focus.length * 2; reasons.push(`Focus area: ${focus.join(", ")}`); }
      if (overlaps(p.sector, project.category)) { score += 2; reasons.push(`Sector: ${p.sector}`); }
      if (p.offerings.length) reasons.push(`Offers: ${p.offerings.join(", ")}`);
      const km = districtDistanceKm(p.district, project.district);
      if (km <= 150) { score += 1; reasons.push(`Operates near the region (${p.district})`); }
      return { partner: p, reasons, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r, i) => ({ partner: r.partner, reasons: r.reasons, rank: i + 1 }));
}

/* ------------------------------------------------------------------ */
/* Solution recommender (knowledge base)                               */
/* ------------------------------------------------------------------ */

export function recommendKnowledge(challenge: { category: string; subTags: string[]; title: string; description: string }, items: KnowledgeItem[], limit = 4) {
  const text = `${challenge.title} ${challenge.description}`.toLowerCase();
  return items
    .map((k) => {
      let score = 0;
      const why: string[] = [];
      if (k.category === challenge.category) { score += 3; why.push(`Same domain (${k.category})`); }
      const tagHits = k.tags.filter((t) => challenge.subTags.some((s) => overlaps(t, s)) || text.includes(t.toLowerCase()));
      if (tagHits.length) { score += tagHits.length * 2; why.push(`Matching tags: ${tagHits.slice(0, 3).join(", ")}`); }
      return { item: k, score, why };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Proposal draft                                                      */
/* ------------------------------------------------------------------ */

export function draftProposal(args: {
  challenge: Challenge;
  cluster?: ChallengeCluster | null;
  clusterSize: number;
  university: University;
  team: { mentors: Person[]; students: Person[] };
  references: KnowledgeItem[];
}) {
  const { challenge: c, clusterSize, university: u, team, references } = args;
  const scope = clusterSize > 1 ? `${clusterSize} locations in and around ${c.district}` : `${c.village || c.block || c.district}, ${c.district}`;
  const needed = expertiseForCategory(c.category, c.subTags);
  const refLine = references.length ? `Reference work reviewed: ${references.map((r) => r.title).join("; ")}.` : "No directly comparable prior project found in the knowledge base; this project will establish a first baseline.";

  const solutionBySubTag: Record<string, string> = {
    "Water Quality": "Test all sources for fluoride, iron, arsenic and bacteriological quality; install a community-scale treatment unit matched to the contaminant (activated alumina / bone-char columns for fluoride, aeration + slow sand filtration for iron, chlorination with dose monitoring for bacterial load) and identify a safe alternative source where treatment is impractical. A village committee is trained on regeneration and periodic testing with the university laboratory.",
    "Irrigation": "Introduce farm ponds and drip / sprinkler kits sized to local cropping patterns, with soil-moisture sensing and a simple local-language advisory, so that limited water supports a second crop.",
    "Crop Loss & Yield": "Deploy a low-cost soil-moisture and weather sensing kit with an advisory service in local language, demonstration plots for resilient varieties and integrated pest management, and link farmer groups to input and market channels.",
    "Post-Harvest & Storage": "Set up a solar-powered community cold room / evaporative cooling store near the collection point, aggregation through the FPO, and a price-information channel to time market visits.",
    "Nutrition": "Strengthen Anganwadi-level screening with digital growth monitoring, weekly supplementation tracking, and locally sourced fortified recipes with counselling for mothers.",
    "Digital Connectivity": "Install a community Wi-Fi mesh / long-range link from the nearest tower with a solar-powered relay, and an offline-first content and services kiosk at the Panchayat.",
    "Forest & Wildlife": "Deploy solar-powered early-warning sensors (PIR / acoustic) along known elephant corridors with SMS alerts to villagers and the Forest Department, plus bio-fencing and community response protocols.",
    "Waste Management": "Introduce household segregation, a decentralised composting and plastic-collection unit run by an SHG, and a simple collection-tracking app for the Panchayat.",
    "Mining & Pollution": "Install a low-cost community air/water quality monitoring network with a public dashboard, dust-suppression measures on haul roads, and green buffers co-designed with local bodies and the mine operator.",
  };
  const solutionByCategory: Record<string, string> = {
    Water: "Combine groundwater recharge (recharge pits / check dams near existing handpumps) with a low-cost IoT water-level and flow monitoring unit, so that seasonal decline is detected early and alternative supply is arranged before the source fails. Community water committees are trained to operate and maintain the system.",
    Agriculture: "Deploy a low-cost soil-moisture and weather sensing kit with an advisory service in local language, paired with demonstration plots for water-efficient practices, and link farmer groups to storage and market channels.",
    Healthcare: "Set up a telemedicine kiosk model at the panchayat level with trained community health workers, a referral protocol to the nearest PHC, and a basic diagnostic kit; use a simple SMS/IVR system for follow-ups.",
    Infrastructure: "Conduct a rapid engineering survey, design a low-cost resilient structure using locally available materials, and provide a maintenance schedule with the Gram Panchayat.",
    Education: "Introduce a solar-powered digital classroom kit with offline content in Hindi and regional languages, teacher training, and a student-attendance tracking dashboard.",
    Environment: "Install a community air/water quality monitoring network with public dashboards, and co-design mitigation measures (dust suppression, green buffers, waste segregation) with local bodies.",
    Energy: "Deploy a solar micro-grid / solar streetlight cluster with a local operator model and a remote fault-monitoring system for quick repairs.",
    Sanitation: "Design decentralised drainage and low-cost toilet units with a community maintenance model and a monitoring app for the Panchayat.",
    Livelihood: "Build a skill-mapping and micro-enterprise support program with SHGs, including product design, quality standards and digital market linkages.",
  };

  const teamText = [
    ...team.mentors.map((m) => `${m.name} (${m.department}) — Faculty mentor`),
    ...team.students.map((s) => `${s.name} (${s.department}) — Student member`),
  ].join("\n");

  return {
    problemStatement: `${c.summary || c.title}\n\nLocation: ${scope}. Approximately ${c.affectedPopulation.toLocaleString("en-IN")} people are affected. Frequency: ${c.frequency}. ${c.hasAlternative ? "An alternative source exists but is inadequate." : "No alternative source is available, making this a critical need."} ${c.vulnerableGroups.length ? `Vulnerable groups affected: ${c.vulnerableGroups.join(", ")}.` : ""}\n\nCitizen description: "${c.description}"`,
    proposedSolution: `${solutionBySubTag[c.subTags[0]] ?? solutionByCategory[c.category] ?? solutionByCategory.Infrastructure}\n\n${refLine}`,
    requiredTeam: `Multidisciplinary team from ${u.name}:\n${teamText || "To be finalised by faculty."}\n\nRequired expertise: ${needed.join(", ")}.`,
    methodology: `1. Field verification and baseline survey in ${scope} (2–3 weeks) with Panchayat and citizens.\n2. Technical design and lab validation using ${u.labs.slice(0, 2).join(" and ") || "university laboratories"}.\n3. Build a working prototype and test in one location.\n4. Pilot in 2–3 locations with different conditions; collect performance and user-acceptance data.\n5. Fix weaknesses, obtain approvals, and prepare a deployment plan with an industry partner.`,
    timeline: `Month 1: Field survey & baseline data\nMonth 2–3: Design and prototype\nMonth 4: Single-site test\nMonth 5–7: Pilot in 2–3 locations\nMonth 8: Evaluation, fixes and scale-up plan`,
    budget: `Estimated total: ₹8–12 lakh\n• Field survey & travel: ₹1.0 lakh\n• Materials & sensors / components: ₹3.5 lakh\n• Fabrication & installation (pilot sites): ₹3.0 lakh\n• Community training & documentation: ₹0.8 lakh\n• Contingency: ₹1.2 lakh\n(To be validated against local material costs during field survey.)`,
    expectedOutcomes: `• A validated, locally maintainable solution proven in ${clusterSize > 1 ? "2–3 pilot villages" : "the pilot site"}\n• Trained local operators / community committee\n• Deployment-ready design and cost sheet for scale-up across ${scope}`,
    impactIndicators: `Measured before and after deployment:\n• People with reliable access (count)\n• Hours of service availability per day\n• Number of shortage / failure days per month\n• Time spent by households on the problem (hours/week)\n• Maintenance cost per month (₹)\n• Citizen satisfaction (survey)`,
    risks: `• Ground conditions (geology, climate, material availability) may differ from assumptions — mitigated by field survey\n• Community acceptance and ownership — mitigated by involving Panchayat from day one\n• Maintenance after pilot — mitigated by training local operators and an industry service partner\n• Connectivity gaps for monitoring — mitigated by offline / SMS fallback`,
  };
}

/* ------------------------------------------------------------------ */
/* Mentor copilot (retrieval + optional LLM)                           */
/* ------------------------------------------------------------------ */

export async function mentorCopilot(question: string, kb: KnowledgeItem[], context?: string): Promise<{ answer: string; sources: KnowledgeItem[] }> {
  const q = question.toLowerCase();
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  const scored = kb
    .map((k) => {
      const hay = `${k.title} ${k.summary} ${k.tags.join(" ")} ${k.category}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0) + k.tags.reduce((s, t) => s + (q.includes(t.toLowerCase()) ? 2 : 0), 0);
      return { k, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.k);

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a technical mentor for university student teams solving rural societal problems in Jharkhand, India. Give practical, low-cost, field-ready guidance in short structured steps. Use the provided references when relevant." },
            { role: "user", content: `${context ? `Project context: ${context}\n\n` : ""}References:\n${scored.map((s) => `- ${s.title}: ${s.summary}`).join("\n")}\n\nQuestion: ${question}` },
          ],
          temperature: 0.4,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const content = data.choices?.[0]?.message?.content;
        if (content) return { answer: content, sources: scored };
      }
    } catch {
      /* fall through to rule-based answer */
    }
  }

  return { answer: ruleBasedAnswer(q, scored, context), sources: scored };
}

function ruleBasedAnswer(q: string, sources: KnowledgeItem[], context?: string): string {
  const parts: string[] = [];
  if (context) parts.push(`Considering your project (${context}):`);

  if (/rainwater|harvest/.test(q)) {
    parts.push(`Low-cost rainwater harvesting design — a practical approach:\n1. Estimate supply: roof area (m²) × annual rainfall (m) × 0.8 runoff coefficient = litres available. Jharkhand averages ~1,200 mm, so a 100 m² roof yields ~96,000 L/year.\n2. First-flush diverter: a simple PVC T-pipe with a ball valve to discard the first 1–2 mm of rain.\n3. Filtration: gravel–sand–charcoal chamber in a 200 L drum before storage.\n4. Storage vs. recharge: for drinking use a ferro-cement tank (~₹8–12 per litre capacity); for handpump revival prefer a recharge pit (1.5 m × 1.5 m × 2 m, filled with boulders, gravel and sand) within 3–5 m of the handpump.\n5. Maintenance: clean filters before every monsoon; involve the village water committee.`);
  } else if (/sensor|iot|monitor|water level/.test(q)) {
    parts.push(`Water monitoring unit — recommended field-ready stack:\n1. Sensing: JSN-SR04T waterproof ultrasonic sensor for tank/well level, or a pressure transducer (4–20 mA) for borewell depth; YF-S201 hall flow sensor for handpump discharge.\n2. Controller: ESP32 with deep-sleep (readings every 30 min) powered by a 6 W solar panel + 18650 battery.\n3. Connectivity: GSM (SIM800L) with SMS fallback where 4G is unreliable; buffer readings on SD card.\n4. Enclosure: IP67 ABS box, cable glands, silica gel; mount above flood line.\n5. Calibration: compare against a manual dip-tape reading weekly during the pilot.\n6. Budget: ₹3,500–6,000 per unit at prototype scale; industry partners can reduce this at volume.`);
  } else if (/pilot|test|village/.test(q)) {
    parts.push(`Designing a pilot:\n1. Pick 2–3 sites with different conditions (e.g., hilly vs. plain, good vs. poor connectivity).\n2. Record a baseline for each impact indicator before installation.\n3. Run for at least one full season; log failures, repairs and user feedback weekly.\n4. Define success thresholds up front (e.g., shortage days reduced by 50%).\n5. Share results with the Panchayat and government before scaling.`);
  } else if (/budget|cost|cheap|afford/.test(q)) {
    parts.push(`Keeping costs low and maintainable:\n1. Prefer locally available materials and components sold in district markets.\n2. Design for repair by a local technician — avoid proprietary parts.\n3. Separate one-time capital cost from recurring cost per month; villages can usually sustain ₹200–500/month per system.\n4. Compare with the cost of the current situation (tankers, lost work hours) to show cost-effectiveness.`);
  } else if (/team|who|expert|skill/.test(q)) {
    parts.push(`Forming the team: aim for a multidisciplinary group — a domain engineer (civil / agriculture / biomedical), a computer science student for sensing and dashboards, a mechanical student for fabrication, and a social-science or management student for community engagement and cost analysis. One faculty mentor with field experience is essential.`);
  } else if (/filter|fluoride|arsenic|quality|purif/.test(q)) {
    parts.push(`Water-quality treatment options for rural use:\n1. Fluoride: activated alumina or bone-char columns at community scale; Nalgonda technique (alum + lime) for household batches.\n2. Iron/turbidity: aeration followed by slow sand filtration.\n3. Bacterial contamination: chlorination with dose monitoring, or SODIS for households.\n4. Always test before and after treatment using a field kit and send periodic samples to the university lab.`);
  } else {
    parts.push(`Suggested approach:\n1. Define the problem precisely with a field visit — measure the current situation (baseline).\n2. Review existing solutions in the knowledge base before designing anything new.\n3. Build the simplest prototype that can be tested in the field within 4–6 weeks.\n4. Choose 2–3 impact indicators you can measure before and after.\n5. Plan maintenance and cost from the start, not at the end.`);
  }

  if (sources.length) {
    parts.push(`Relevant references from the knowledge base:\n${sources.map((s) => `• ${s.title} (${s.type}) — ${s.summary}`).join("\n")}`);
  }
  parts.push("Remember: verify every assumption against ground conditions with your faculty mentor before finalising the design.");
  return parts.join("\n\n");
}
