// Mystery product acceptance.
//
// This profile exists to stop a cluster of conflations, and this file asserts
// that the model cannot commit any of them - not through the weights, not
// through a guardrail gap, not through a row gate and not through an archetype
// bonus:
//
//   "there is a mysterious premise"  !=  "the mystery keeps mattering"
//   "there is an investigation"      !=  "the story is telling me anything"
//   "there is one huge final twist"  !=  "the story kept rebuilding itself"
//   "there is a ghost"               !=  "this is a Mystery recommendation"
//   "there is no ghost"              !=  "the supernatural is disqualifying"
//   "it looks of an earlier era"     !=  "it is excluded"
//
// Run with: node test/mystery-profile.test.mjs

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateProfile, watchedEvidenceIdentities } from "../scripts/validate-profile.mjs";
import { makePolicy, scoreItem, hardExcluded, baselineContentPre, evalCondition, exclusionCondition } from "../scripts/dna-score.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

let passed = 0, failed = 0;
const check = (id, description, condition, detail) => {
  if (condition) { passed++; console.log(`  ok   ${id}  ${description}`); }
  else { failed++; console.error(`  FAIL ${id}  ${description}${detail ? `\n         ${detail}` : ""}`); }
};

const profile = JSON.parse(fs.readFileSync(path.join(root, "data", "taste-profile.json"), "utf8"));
const config = JSON.parse(fs.readFileSync(path.join(root, "config", "catalogs.json"), "utf8"));
const policy = makePolicy(profile);
const registry = profile.dna_dimensions.dimensions.map(d => d.id);
const weights = profile.dna_baseline.weights;
const row = id => config.catalogs.find(c => c.id === id);

console.log("WTF Mystery Discovery - product acceptance");
console.log("");

// ---------------------------------------------------------------------------
// A-H  structure
// ---------------------------------------------------------------------------
const EXPECTED = ["central_mystery","mystery_density","unexplained_phenomenon","cause_uncertainty",
  "investigation","clue_puzzling","culprit_hunt","progressive_revelation","revelation_frequency",
  "plot_twists","misdirection","suspense","hidden_truth","conspiracy_coverup","containment",
  "unknown_rules","time_anomaly","reality_uncertainty","memory_identity_uncertainty",
  "scientific_cause","supernatural_cause","paranormal_horror_focus","horror_focus",
  "survival_pressure","weirdness","drama_focus","romance_focus","visual_quality",
  "retro_visual_style","pace_speed"];

check("A1", "registry declares exactly 30 dimensions", registry.length === 30, `got ${registry.length}`);
check("A2", "registry matches the approved Mystery set exactly",
  [...registry].sort().join(",") === [...EXPECTED].sort().join(","),
  `unexpected: ${registry.filter(d => !EXPECTED.includes(d)).join(", ") || "none"}; missing: ${EXPECTED.filter(d => !registry.includes(d)).join(", ") || "none"}`);
check("A3", "the tag registry is a closed vocabulary of 20",
  profile.dna_dimensions.tag_registry.length === 20);
check("B1", "29 weighted dimensions", Object.keys(weights).length === 29, `got ${Object.keys(weights).length}`);
check("C1", "pace_speed is the ONLY unweighted dimension",
  profile.dna_baseline.unweighted.length === 1 && profile.dna_baseline.unweighted[0] === "pace_speed",
  "speed is not itself desirable: Lost was slow and still liked");

const APPROVED = { central_mystery:20, mystery_density:20, progressive_revelation:18,
  revelation_frequency:18, unexplained_phenomenon:17, cause_uncertainty:16, suspense:15,
  unknown_rules:14, clue_puzzling:14, plot_twists:13, reality_uncertainty:13, investigation:12,
  hidden_truth:12, conspiracy_coverup:12, containment:12, culprit_hunt:11, time_anomaly:11,
  misdirection:11, memory_identity_uncertainty:10, weirdness:10, visual_quality:10,
  scientific_cause:8, supernatural_cause:6, survival_pressure:5, horror_focus:-4,
  drama_focus:-10, romance_focus:-10, retro_visual_style:-12, paranormal_horror_focus:-14 };
const diffs = Object.entries(APPROVED).filter(([k, v]) => weights[k] !== v).map(([k, v]) => `${k}: want ${v}, got ${weights[k]}`);
check("D1", "every baseline weight matches the approved value", diffs.length === 0, diffs.join("\n         "));
check("D2", "the payoff dimensions outweigh the procedure",
  weights.progressive_revelation > weights.investigation
  && weights.revelation_frequency > weights.investigation,
  "this profile buys the answers, not the inquiry");
check("D3", "central_mystery and mystery_density carry equal top weight",
  weights.central_mystery === weights.mystery_density
  && Object.values(weights).every(w => w <= weights.central_mystery),
  "a premise and its whole-runtime delivery are equally load-bearing");
check("D4", "scientific_cause and supernatural_cause are BOTH positive",
  weights.scientific_cause > 0 && weights.supernatural_cause > 0,
  "the kind of explanation is not the preference; pursuing one is");
check("D5", "paranormal_horror_focus is the largest negative, not supernatural_cause",
  weights.paranormal_horror_focus < 0
  && weights.paranormal_horror_focus === Math.min(...Object.values(weights))
  && weights.supernatural_cause > 0);

const required = profile.dna_baseline.completeness_defaults.required_known_dimensions;
check("E1", "mystery_density, revelation_frequency and progressive_revelation are ALL required-known",
  ["mystery_density", "revelation_frequency", "progressive_revelation"].every(d => required.includes(d)),
  "an unmeasured cadence is how a premise-only show would slip through");
check("E2", "retro_visual_style is required-known even though no guardrail may use it",
  required.includes("retro_visual_style"));
check("F1", "min_known_dimensions is 22 of 30",
  profile.dna_baseline.completeness_defaults.min_known_dimensions === 22);

const ROWS = ["full-watchlist","past-24h","best-matches","dna-match","unexplained-phenomena",
  "reality-time-wtf","trapped-contained","murder-culprit-hunt","clues-puzzles",
  "hidden-truths-conspiracies","high-suspense","impossible-supernatural"];
check("H1", "12 logical rows", config.catalogs.length === 12, `got ${config.catalogs.length}`);
check("H2", "row ids are exactly the approved set", config.catalogs.map(c => c.id).join(",") === ROWS.join(","));
const baseRows = config.catalogs.filter(c => c.dna && c.dna.mode === "baseline_profile");
check("G1", "exactly one baseline_profile row, and it is dna-match",
  baseRows.length === 1 && baseRows[0].id === "dna-match");
check("G2", "every themed DNA row is weighted, never baseline_profile",
  config.catalogs.filter(c => c.filter === "dna" && c.id !== "dna-match").every(c => c.dna.mode === "weighted"));
check("G3", "every themed DNA row gates on a payoff dimension, not just a topic", (() => {
  const themed = config.catalogs.filter(c => c.filter === "dna" && c.id !== "dna-match");
  return themed.every(c => {
    const dims = [...(c.dna.gate.all_of || []), ...(c.dna.gate.any_of || [])].map(x => x.dimension);
    return dims.some(d => ["revelation_frequency", "mystery_density", "progressive_revelation"].includes(d));
  });
})(), "a row must never fill on premise or procedure alone");
if (fs.existsSync(path.join(root, "site", "manifest.json"))) {
  const m = JSON.parse(fs.readFileSync(path.join(root, "site", "manifest.json"), "utf8"));
  check("H3", "24 emitted manifest catalogs", m.catalogs.length === 24, `got ${m.catalogs.length}`);
  check("H4", "manifest id is the approved Mystery id", m.id === "com.github.wtfmystery.discovery", m.id);
}

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------
const NEUTRAL = Object.fromEntries(registry.map(id => [id, 5]));
const item = (over = {}, meta = {}) => ({
  imdb_id: meta.imdb_id || "tt9999999", type: "movie", title: meta.title || "Probe",
  year: meta.year || 2020, status: "watch", match_score: 70, tags: [], reason: "probe",
  added_at: "2026-09-02T00:00:00Z", added_by: "bootstrap",
  source: "https://example.org/identity ; https://example.org/structure ; https://example.org/review",
  dna: { ...NEUTRAL, ...over }, dna_confidence: 0.9, dna_tags: [], ...meta
});
const scoreOf = (over, def = row("dna-match")) => scoreItem(policy, def, item(over), new Map());

const fires = (over, id) => {
  const dna = { ...NEUTRAL, ...over };
  const r = profile.dna_guardrails.combination.find(x => x.id === id);
  if (!r) return false;
  const test = c => Object.prototype.hasOwnProperty.call(c, "at_or_above")
    ? dna[c.dimension] >= c.at_or_above : dna[c.dimension] <= c.at_or_below;
  return r.all_of.every(test) && (!r.any_of.length || r.any_of.some(test));
};

// TEST A - a strong unexplained-phenomenon mystery, the centre of gravity.
const PHENOMENON = { central_mystery: 10, mystery_density: 9, unexplained_phenomenon: 10,
  cause_uncertainty: 10, investigation: 6, clue_puzzling: 7, culprit_hunt: 3,
  progressive_revelation: 8, revelation_frequency: 8, plot_twists: 7, misdirection: 6,
  suspense: 9, hidden_truth: 8, conspiracy_coverup: 6, containment: 9, unknown_rules: 9,
  time_anomaly: 3, reality_uncertainty: 6, memory_identity_uncertainty: 3, scientific_cause: 7,
  supernatural_cause: 4, paranormal_horror_focus: 1, horror_focus: 4, survival_pressure: 7,
  weirdness: 8, drama_focus: 5, romance_focus: 2, visual_quality: 8, retro_visual_style: 2,
  pace_speed: 5 };

// TEST D - a Knives-Out-shaped twisty culprit mystery.
const CULPRIT = { ...PHENOMENON, unexplained_phenomenon: 0, cause_uncertainty: 4,
  containment: 4, unknown_rules: 1, reality_uncertainty: 1, supernatural_cause: 0,
  survival_pressure: 3, weirdness: 2, scientific_cause: 0, horror_focus: 1,
  investigation: 8, clue_puzzling: 9, culprit_hunt: 10, misdirection: 10, plot_twists: 9,
  revelation_frequency: 9, progressive_revelation: 8, pace_speed: 7 };

check("SANITY", "a strong phenomenon mystery scores strongly",
  scoreOf(PHENOMENON).score >= 80, JSON.stringify(scoreOf(PHENOMENON)));

// ---------------------------------------------------------------------------
// TEST A / TEST D  the two wanted shapes
// ---------------------------------------------------------------------------
check("TA1", "TEST A - strong phenomenon mystery is eligible and scores high",
  scoreOf(PHENOMENON).score !== null && scoreOf(PHENOMENON).score >= 80, `${scoreOf(PHENOMENON).score}`);
check("TA2", "...and fires no guardrail",
  profile.dna_guardrails.combination.every(r => !fires(PHENOMENON, r.id)));
check("TD1", "TEST D - a Knives-Out-shaped culprit mystery scores strongly",
  scoreOf(CULPRIT).score >= 70, `${scoreOf(CULPRIT).score}`);
check("TD2", "...and enters both the culprit and the clues rows",
  scoreItem(policy, row("murder-culprit-hunt"), item(CULPRIT), new Map()).score !== null
  && scoreItem(policy, row("clues-puzzles"), item(CULPRIT), new Map()).score !== null);

// ---------------------------------------------------------------------------
// TEST B  premise without density - THE Leftovers shape
// ---------------------------------------------------------------------------
const LEFTOVERS = { ...PHENOMENON, mystery_density: 3, revelation_frequency: 3,
  progressive_revelation: 3, drama_focus: 10, investigation: 3, clue_puzzling: 2,
  suspense: 5, pace_speed: 3 };
check("TB1", "TEST B - a huge premise with no ongoing density FIRES premise_without_density",
  fires(LEFTOVERS, "premise_without_density"));
check("TB2", "...and also drama_drift", fires(LEFTOVERS, "drama_drift"));
check("TB3", "...and scores far below the same premise that keeps delivering", (() => {
  const bad = scoreOf(LEFTOVERS).score, good = scoreOf(PHENOMENON).score;
  return bad === null || good - bad >= 25;
})(), `${scoreOf(LEFTOVERS).score} vs ${scoreOf(PHENOMENON).score}`);
check("TB4", "central_mystery ALONE cannot rescue it",
  scoreOf({ ...LEFTOVERS, central_mystery: 10, unexplained_phenomenon: 10 }).score === null
  || scoreOf({ ...LEFTOVERS, central_mystery: 10, unexplained_phenomenon: 10 }).score < scoreOf(PHENOMENON).score - 20,
  "a magnificent premise is not a magnificent mystery");
check("TB5", "raising mystery_density is what actually recovers it",
  (scoreOf({ ...LEFTOVERS, mystery_density: 9, revelation_frequency: 8, progressive_revelation: 8 }).score ?? 0)
  > (scoreOf(LEFTOVERS).score ?? 0) + 20);

// ---------------------------------------------------------------------------
// TEST C  investigation without payoff
// ---------------------------------------------------------------------------
const PROCEDURAL = { ...CULPRIT, investigation: 10, revelation_frequency: 3,
  progressive_revelation: 3, pace_speed: 2, plot_twists: 2, misdirection: 4, suspense: 4,
  central_mystery: 6, mystery_density: 5, weirdness: 1, drama_focus: 8 };
check("TC1", "TEST C - a slow procedural with no payoff FIRES slow_procedural_without_payoff",
  fires(PROCEDURAL, "slow_procedural_without_payoff"));
check("TC2", "an EVENTFUL investigation does NOT fire it",
  !fires(CULPRIT, "slow_procedural_without_payoff"),
  "being a procedural is never the objection");
check("TC3", "a SLOW investigation that still reveals does not fire it",
  !fires({ ...PROCEDURAL, revelation_frequency: 7, progressive_revelation: 7 }, "slow_procedural_without_payoff"),
  "slow is not the problem; silent is");
check("TC4", "raising investigation ALONE cannot rescue it", (() => {
  const maxed = { ...PROCEDURAL, investigation: 10, clue_puzzling: 10, culprit_hunt: 10 };
  const a = scoreOf(PROCEDURAL).score ?? 0, b = scoreOf(maxed).score ?? 0;
  return fires(maxed, "slow_procedural_without_payoff") && b < (scoreOf(CULPRIT).score - 15);
})(), "more procedure is not more payoff");
check("TC5", "raising the CADENCE materially improves it",
  (scoreOf({ ...PROCEDURAL, revelation_frequency: 9, progressive_revelation: 9 }).score ?? 0)
  > (scoreOf(PROCEDURAL).score ?? 0) + 15);
check("TC6", "the procedural fixture cannot enter Clues & Puzzles or High Suspense",
  scoreItem(policy, row("clues-puzzles"), item(PROCEDURAL), new Map()).score === null
  && scoreItem(policy, row("high-suspense"), item(PROCEDURAL), new Map()).score === null,
  "the row gates reject it even though its investigation is maximal");

// ---------------------------------------------------------------------------
// TEST E / TEST F  the paranormal split - the most consequential distinction
// ---------------------------------------------------------------------------
const HAUNTING = { ...PHENOMENON, central_mystery: 5, mystery_density: 5,
  unexplained_phenomenon: 6, progressive_revelation: 4, revelation_frequency: 3,
  investigation: 4, clue_puzzling: 4, unknown_rules: 4, supernatural_cause: 10,
  paranormal_horror_focus: 10, horror_focus: 10, weirdness: 6, pace_speed: 4 };
const SUPERNATURAL_MYSTERY = { ...PHENOMENON, supernatural_cause: 9,
  paranormal_horror_focus: 6, horror_focus: 7, unknown_rules: 8, central_mystery: 9,
  progressive_revelation: 8, revelation_frequency: 7, mystery_density: 9 };

check("TE1", "TEST E - paranormal horror first FIRES paranormal_horror_first",
  fires(HAUNTING, "paranormal_horror_first"));
check("TE2", "...and scores far below a supernatural MYSTERY", (() => {
  const a = scoreOf(HAUNTING).score, b = scoreOf(SUPERNATURAL_MYSTERY).score;
  return a === null || b - a >= 25;
})(), `${scoreOf(HAUNTING).score} vs ${scoreOf(SUPERNATURAL_MYSTERY).score}`);
check("TF1", "TEST F - an Archive-81/Outsider-shaped supernatural mystery does NOT fire it",
  !fires(SUPERNATURAL_MYSTERY, "paranormal_horror_first"),
  "the impossible cause is welcome when it serves the central question");
check("TF2", "...is NOT hard-excluded", !hardExcluded(policy, { ...NEUTRAL, ...SUPERNATURAL_MYSTERY }));
check("TF3", "...and scores strongly", scoreOf(SUPERNATURAL_MYSTERY).score >= 75,
  `${scoreOf(SUPERNATURAL_MYSTERY).score}`);
check("TF4", "...and reaches the Impossible & Supernatural row",
  scoreItem(policy, row("impossible-supernatural"), item(SUPERNATURAL_MYSTERY), new Map()).score !== null);
check("TF5", "a ghost with no mystery development CANNOT reach that row",
  scoreItem(policy, row("impossible-supernatural"), item(HAUNTING), new Map()).score === null,
  "'there is a ghost' is never a Mystery recommendation");
check("TF6", "supernatural_cause is not referenced by ANY guardrail", (() => {
  const dims = [...profile.dna_guardrails.hard_exclusion.map(r => r.dimension),
    ...profile.dna_guardrails.combination.flatMap(r => [...r.all_of, ...r.any_of].map(c => c.dimension))];
  return !dims.includes("supernatural_cause");
})(), "the supernatural is never penalised for its kind");
check("TF7", "raising supernatural_cause alone RAISES the score",
  scoreOf({ ...PHENOMENON, supernatural_cause: 9 }).score >= scoreOf({ ...PHENOMENON, supernatural_cause: 0 }).score);
check("TF8", "raising paranormal_horror_focus alone LOWERS it",
  scoreOf({ ...PHENOMENON, paranormal_horror_focus: 9 }).score < scoreOf({ ...PHENOMENON, paranormal_horror_focus: 0 }).score);

// ---------------------------------------------------------------------------
// TEST G  retro presentation - a penalty, never an exclusion
// ---------------------------------------------------------------------------
const guardDims = [...profile.dna_guardrails.hard_exclusion.map(r => r.dimension),
  ...profile.dna_guardrails.combination.flatMap(r => [...r.all_of, ...r.any_of].map(c => c.dimension))];
check("TG1", "TEST G - NO guardrail references retro_visual_style", !guardDims.includes("retro_visual_style"));
check("TG2", "a retro but excellent mystery stays eligible and is only softened", (() => {
  const retro = { ...PHENOMENON, visual_quality: 10, retro_visual_style: 9 };
  const modern = { ...PHENOMENON, visual_quality: 10, retro_visual_style: 1 };
  return scoreOf(retro).score !== null && scoreOf(retro).score < scoreOf(modern).score
    && !fires(retro, "cheap_presentation");
})(), "high craft that simply looks of an earlier era is not cheap");
check("TG3", "a retro but exceptional mystery still clears the minimum",
  scoreOf({ ...PHENOMENON, visual_quality: 10, retro_visual_style: 10 }).score
    >= profile.automation_rules.minimum_match_score,
  "a sufficiently exceptional Mystery overcomes the retro preference");
check("TG4", "cheap_presentation is about CRAFT, not era",
  fires({ ...PHENOMENON, visual_quality: 2, retro_visual_style: 0 }, "cheap_presentation")
  && !fires({ ...PHENOMENON, visual_quality: 9, retro_visual_style: 10 }, "cheap_presentation"));
check("TG5", "no dimension is about release year", !registry.some(d => /year|age|old|date|decade/.test(d)));
check("TG6", "release year changes NO score", (() => {
  const a = scoreItem(policy, row("dna-match"), item(PHENOMENON, { year: 1974, title: "Old" }), new Map());
  const b = scoreItem(policy, row("dna-match"), item(PHENOMENON, { year: 2026, title: "New" }), new Map());
  return a.score === b.score && a.score !== null;
})());

// ---------------------------------------------------------------------------
// TEST H  fast but empty
// ---------------------------------------------------------------------------
const FAST_EMPTY = { ...PHENOMENON, pace_speed: 10, revelation_frequency: 3,
  progressive_revelation: 3, mystery_density: 4, plot_twists: 3, unknown_rules: 3,
  cause_uncertainty: 3, suspense: 8 };
check("TH1", "TEST H - speed alone does not rescue a low-payoff mystery",
  (scoreOf(FAST_EMPTY).score ?? 0) < scoreOf(PHENOMENON).score - 25,
  `${scoreOf(FAST_EMPTY).score} vs ${scoreOf(PHENOMENON).score}`);
check("TH2", "pace_speed carries no linear weight at all",
  !Object.prototype.hasOwnProperty.call(weights, "pace_speed"));
check("TH3", "changing ONLY pace_speed changes nothing outside the guardrail", (() => {
  const slow = { ...PHENOMENON, pace_speed: 0 }, fast = { ...PHENOMENON, pace_speed: 10 };
  return scoreOf(slow).score === scoreOf(fast).score;
})(), "a slow mystery that keeps revealing is exactly what this profile wants");

// ---------------------------------------------------------------------------
// TEST I  one final twist is not progressive revelation
// ---------------------------------------------------------------------------
check("TI1", "TEST I - plot_twists and progressive_revelation are separate dimensions",
  registry.includes("plot_twists") && registry.includes("progressive_revelation")
  && weights.plot_twists !== undefined && weights.progressive_revelation !== undefined);
check("TI2", "a one-big-final-twist fixture is expressible and remains eligible",
  scoreOf({ ...PHENOMENON, plot_twists: 10, progressive_revelation: 3 }).score !== null);
check("TI3", "...and scores below the same fixture with sustained reframing",
  scoreOf({ ...PHENOMENON, plot_twists: 10, progressive_revelation: 3 }).score
  < scoreOf({ ...PHENOMENON, plot_twists: 10, progressive_revelation: 9 }).score,
  "nothing was being rebuilt along the way, and the model must be able to say so");
check("TI4", "progressive_revelation outweighs plot_twists",
  weights.progressive_revelation > weights.plot_twists);

// ---------------------------------------------------------------------------
// TEST J  trapped survival with no question
// ---------------------------------------------------------------------------
const SURVIVAL_ONLY = { ...NEUTRAL, central_mystery: 3, mystery_density: 2,
  unexplained_phenomenon: 4, cause_uncertainty: 2, unknown_rules: 2, containment: 9,
  survival_pressure: 10, suspense: 9, revelation_frequency: 3, progressive_revelation: 3,
  investigation: 2, clue_puzzling: 2, culprit_hunt: 1, drama_focus: 6, horror_focus: 7,
  visual_quality: 8, retro_visual_style: 0, pace_speed: 7, plot_twists: 2, misdirection: 1,
  hidden_truth: 2, conspiracy_coverup: 0, time_anomaly: 0, reality_uncertainty: 0,
  memory_identity_uncertainty: 0, scientific_cause: 4, supernatural_cause: 0,
  paranormal_horror_focus: 0, weirdness: 3, romance_focus: 2 };
check("TJ1", "TEST J - containment plus survival with no live question FIRES survival_without_question",
  fires(SURVIVAL_ONLY, "survival_without_question"));
check("TJ2", "...and is NOT treated like an Under-the-Dome mystery", (() => {
  const a = scoreOf(SURVIVAL_ONLY).score, b = scoreOf(PHENOMENON).score;
  return a === null || b - a >= 30;
})(), `${scoreOf(SURVIVAL_ONLY).score} vs ${scoreOf(PHENOMENON).score}`);
check("TJ3", "...and cannot enter Trapped & Contained despite maximal containment",
  scoreItem(policy, row("trapped-contained"), item(SURVIVAL_ONLY), new Map()).score === null,
  "mere survival must never dominate a contained-mystery row");
check("TJ4", "adding a real unknown cause and rule discovery rescues it",
  (scoreOf({ ...SURVIVAL_ONLY, central_mystery: 9, mystery_density: 8, cause_uncertainty: 9,
    unknown_rules: 9, revelation_frequency: 7, progressive_revelation: 7 }).score ?? 0)
  > (scoreOf(SURVIVAL_ONLY).score ?? 0) + 25);
check("TJ5", "a title with essentially NO central mystery is hard-excluded at ingestion",
  hardExcluded(policy, { ...SURVIVAL_ONLY, central_mystery: 2 })
  && !hardExcluded(policy, { ...SURVIVAL_ONLY, central_mystery: 3 }),
  "the Full Watchlist row does not consult DNA and would publish it otherwise");
check("TJ6", "the hard exclusion is the ONLY one and it names central_mystery",
  profile.dna_guardrails.hard_exclusion.length === 1
  && profile.dna_guardrails.hard_exclusion[0].dimension === "central_mystery");

// ---------------------------------------------------------------------------
// archetypes cannot bypass the density or the cadence requirement
// ---------------------------------------------------------------------------
check("AR1", "there are exactly 7 approved archetypes",
  profile.dna_baseline.archetypes.map(a => a.id).join(",") ===
  "unexplained_phenomenon_mystery,reality_time_mystery,contained_world_mystery," +
  "hidden_world_conspiracy,twisty_culprit_mystery,hidden_cause_whydunit,impossible_cause_mystery");
check("AR2", "EVERY archetype emphasises mystery_density at 7 or more",
  profile.dna_baseline.archetypes.every(a => (a.emphasis.mystery_density || 0) >= 7),
  profile.dna_baseline.archetypes.filter(a => (a.emphasis.mystery_density || 0) < 7).map(a => a.id).join(", "));
check("AR3", "EVERY archetype emphasises revelation_frequency at 7 or more",
  profile.dna_baseline.archetypes.every(a => (a.emphasis.revelation_frequency || 0) >= 7),
  profile.dna_baseline.archetypes.filter(a => (a.emphasis.revelation_frequency || 0) < 7).map(a => a.id).join(", "));
check("AR4", "no archetype gives the premise-only fixture a large bonus", (() => {
  const bonusMax = row("dna-match").dna.archetype_bonus_max;
  const bad = baselineContentPre(policy, item(LEFTOVERS), bonusMax);
  const good = baselineContentPre(policy, item(PHENOMENON), bonusMax);
  return bad.archetypeBonus < good.archetypeBonus;
})(), "a premise-flavoured archetype without a density requirement is exactly the bypass this forbids");
check("AR5", "no archetype gives the slow-procedural fixture a large bonus", (() => {
  const bonusMax = row("dna-match").dna.archetype_bonus_max;
  return baselineContentPre(policy, item(PROCEDURAL), bonusMax).archetypeBonus
    < baselineContentPre(policy, item(CULPRIT), bonusMax).archetypeBonus;
})());
check("AR6", "impossible_cause_mystery REQUIRES a central mystery and rule discovery", (() => {
  const a = profile.dna_baseline.archetypes.find(x => x.id === "impossible_cause_mystery");
  return a.requires_mode === "all"
    && a.requires.some(r => r.dimension === "central_mystery")
    && a.requires.some(r => r.dimension === "unknown_rules")
    && (a.penalise || {}).paranormal_horror_focus > 0;
})(), "'a ghost is present' must never match it");

// ---------------------------------------------------------------------------
// TEST K  watched semantics and partial series
// ---------------------------------------------------------------------------
const evidence = profile.baseline_evidence.items;
const watched = watchedEvidenceIdentities(profile);
const WATCHED_TITLES = ["Knives Out", "The Sixth Sense", "Dark", "Lost", "Severance", "Under the Dome"];
check("TK1", "exactly the six confirmed titles are watched",
  evidence.filter(i => i.evidence_type === "watched").map(i => i.title).sort().join(",") ===
  [...WATCHED_TITLES].sort().join(","));
check("TK2", "every watched entry accounts for HOW watching was confirmed",
  evidence.filter(i => i.evidence_type === "watched")
    .every(i => typeof i.watched_confirmation === "string" && i.watched_confirmation.trim().length > 0));
check("TK3", "TEST K - every partial/uncertain series stays RECOMMENDABLE", (() => {
  const partial = ["The OA", "Archive 81", "Bodies", "Twin Peaks"];
  return partial.every(t => {
    const e = evidence.find(i => i.title === t);
    return e && e.evidence_type === "unwatched" && e.recommendable === true;
  });
})(), "one Stremio identity per series: excluding them would hide unseen episodes");
check("TK4", "...and each records the partial exposure explicitly", (() => {
  const partial = ["The OA", "Archive 81", "Bodies", "Twin Peaks"];
  return partial.every(t => evidence.find(i => i.title === t)
    .notes.some(n => /PARTIAL EXPOSURE|COMPLETION NOT CONFIRMED/i.test(n)));
})());
check("TK5", "Shutter Island is unwatched because the user could not remember", (() => {
  const e = evidence.find(i => i.title === "Shutter Island");
  return e.evidence_type === "unwatched" && e.recommendable === true
    && e.notes.some(n => /EXPLICITLY UNCERTAIN/i.test(n));
})(), "uncertainty resolves to unwatched");
check("TK6", "Zodiac is unwatched: documentaries about the case are not the film", (() => {
  const e = evidence.find(i => i.title === "Zodiac");
  return e.evidence_type === "unwatched" && e.notes.some(n => /documentaries/i.test(n));
})());
check("TK7", "the watched identity set contains exactly six identities", watched.length === 6, `${watched.length}`);
check("TK8", "no watched title appears in the public library", (() => {
  const lib = JSON.parse(fs.readFileSync(path.join(root, "data", "library.json"), "utf8")).items;
  return !lib.some(i => WATCHED_TITLES.includes(i.title));
})());
check("TK9", "the partial/uncertain titles the profile still wants ARE in the library", (() => {
  const lib = new Set(JSON.parse(fs.readFileSync(path.join(root, "data", "library.json"), "utf8")).items.map(i => i.title));
  return ["The OA", "Archive 81", "Shutter Island"].every(t => lib.has(t));
})(), "partial exposure is not exclusion");
check("TK10", "The Rain and The Mist are cited only as shape anchors, never as evidence entries",
  !evidence.some(i => i.title === "The Rain" || i.title === "The Mist")
  && /The Rain and The Mist/.test(profile.mission),
  "no viewing is implied and no adaptation identity is assumed");
check("TK11", "all 50 calibration reactions are recorded", evidence.length === 50, `${evidence.length}`);

// ---------------------------------------------------------------------------
// TEST L  duplicate identity fails closed
// ---------------------------------------------------------------------------
function runValidateWith(items) {
  const file = path.join(root, "data", "library.json");
  const original = fs.readFileSync(file);
  try {
    fs.writeFileSync(file, JSON.stringify({ schema_version: 2, updated_at: "2026-09-02T12:00:00Z", items }, null, 2) + "\n");
    try { return { code: 0, output: execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: root, encoding: "utf8", stdio: "pipe" }) }; }
    catch (e) { return { code: e.status, output: `${e.stdout || ""}${e.stderr || ""}` }; }
  } finally {
    fs.writeFileSync(file, original);
    if (!fs.readFileSync(file).equals(original)) throw new Error("library.json was not restored");
  }
}
{
  const dup = runValidateWith([item(PHENOMENON, { imdb_id: "tt5555555", title: "A" }), item(PHENOMENON, { imdb_id: "tt5555555", title: "B" })]);
  check("TL1", "TEST L - a duplicate public identity FAILS CLOSED",
    dup.code !== 0 && /duplicate public identity/.test(dup.output));
  const noId = runValidateWith([item(PHENOMENON, { imdb_id: null, title: "Same Title", year: 2020 }),
    item(PHENOMENON, { imdb_id: null, title: "same  title", year: 2020 })]);
  check("TL2", "...and so does the normalized title+year+type fallback",
    noId.code !== 0 && /duplicate public identity/.test(noId.output));
  const watchedLeak = runValidateWith([item(PHENOMENON, { imdb_id: "tt5753856", type: "series", title: "Dark", year: 2017 })]);
  check("TL3", "a WATCHED evidence title cannot be ingested",
    watchedLeak.code !== 0 && /WATCHED baseline evidence/.test(watchedLeak.output));
  const excluded = runValidateWith([item({ ...PHENOMENON, central_mystery: 1 }, { imdb_id: "tt5555556", title: "No Mystery" })]);
  check("TL4", "a hard-excluded title cannot be ingested",
    excluded.code !== 0 && /hard exclusion/.test(excluded.output),
    "the plain watch rows do not consult DNA and would publish it anyway");
}

// ---------------------------------------------------------------------------
// provenance, determinism, hygiene
// ---------------------------------------------------------------------------
const sourceItems = [...JSON.parse(fs.readFileSync(path.join(root, "data", "library.json"), "utf8")).items];
const discDir = path.join(root, "data", "discoveries");
if (fs.existsSync(discDir)) {
  for (const n of fs.readdirSync(discDir).filter(x => x.endsWith(".json"))) {
    const p = JSON.parse(fs.readFileSync(path.join(discDir, n), "utf8"));
    sourceItems.push(...(Array.isArray(p) ? p : p.items || []));
  }
}
const urlsIn = v => String(v).split(/[;,\s]+/).flatMap(t => {
  try { const u = new URL(t.trim()); return /^https?:$/.test(u.protocol) && u.hostname.includes(".") ? [u.href] : []; }
  catch { return []; }
});
const distinctIn = v => [...new Set(urlsIn(v).map(h => { const u = new URL(h); u.hash = ""; return u.href; }))];

check("PV1", "every item cites real URLs", sourceItems.every(i => urlsIn(i.source).length > 0));
check("PV2", "no item repeats a normalized source URL",
  sourceItems.every(i => urlsIn(i.source).length === distinctIn(i.source).length),
  sourceItems.filter(i => urlsIn(i.source).length !== distinctIn(i.source).length).map(i => i.title).join(", "));
check("PV3", "every item cites THREE OR MORE DISTINCT sources",
  sourceItems.every(i => distinctIn(i.source).length >= 3),
  sourceItems.filter(i => distinctIn(i.source).length < 3).map(i => `${i.title} (${distinctIn(i.source).length})`).join(", "));
check("PV4", "every item cites at least one source beyond bare identity metadata",
  sourceItems.every(i => distinctIn(i.source).some(u => !u.includes("cinemeta"))));
check("PV5", "every SERIES cites whole-runtime episode evidence",
  sourceItems.filter(i => i.type === "series").every(i => distinctIn(i.source).some(u => /tvmaze\.com/.test(u))),
  "a synopsis cannot establish mystery_density or revelation cadence across a run");
check("DT1", "every stored match_score re-derives EXACTLY from DNA",
  sourceItems.every(i => scoreItem(policy, row("dna-match"), i, new Map()).score === i.match_score),
  sourceItems.filter(i => scoreItem(policy, row("dna-match"), i, new Map()).score !== i.match_score)
    .map(i => `${i.title}: stored ${i.match_score}, computed ${scoreItem(policy, row("dna-match"), i, new Map()).score}`).join("; "));
check("DT2", "every item has a complete 30-value DNA vector",
  sourceItems.every(i => registry.every(d => Number.isInteger(i.dna[d]))));
check("DT3", "no accepted item is below the calibrated minimum",
  sourceItems.every(i => i.match_score >= profile.automation_rules.minimum_match_score));
check("DT4", "every dna_tag comes from the closed registry", (() => {
  const reg = new Set(profile.dna_dimensions.tag_registry);
  return sourceItems.every(i => (i.dna_tags || []).every(t => reg.has(t)));
})());
check("DT5", "no item violates a hard exclusion",
  sourceItems.every(i => !hardExcluded(policy, i.dna)));
check("DT6", "ranks are 1..N in descending match_score order", (() => {
  const lib = JSON.parse(fs.readFileSync(path.join(root, "data", "library.json"), "utf8")).items;
  return lib.every((it, i) => it.rank === i + 1)
    && lib.every((it, i) => i === 0 || lib[i - 1].match_score >= it.match_score);
})());
check("DT7", "the bootstrap carries both movies and series",
  sourceItems.filter(i => i.type === "movie").length >= 10
  && sourceItems.filter(i => i.type === "series").length >= 10,
  `${sourceItems.filter(i => i.type === "movie").length} movies, ${sourceItems.filter(i => i.type === "series").length} series`);

if (fs.existsSync(path.join(root, "site", "catalog"))) {
  const p24 = ["movie", "series"].map(t => path.join(root, "site", "catalog", t, `past-24h-${t}.json`))
    .filter(f => fs.existsSync(f)).flatMap(f => JSON.parse(fs.readFileSync(f, "utf8")).metas);
  const bootstrapIds = new Set(sourceItems.filter(i => i.added_by === "bootstrap").map(i => i.imdb_id));
  const leaked = p24.filter(m => bootstrapIds.has(String(m.id).split(":")[0]));
  check("P24", "Past 24h contains no bootstrap item", leaked.length === 0,
    `${leaked.map(m => m.name).join(", ")} leaked`);
}
check("PS1", "no personalized-scores.json exists", !fs.existsSync(path.join(root, "data", "personalized-scores.json")));

// ---------------------------------------------------------------------------
// engine integrity, independence, pipeline
// ---------------------------------------------------------------------------
{
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "test", "engine-checksums.json"), "utf8")).files;
  const scripts = fs.readdirSync(path.join(root, "scripts")).filter(n => n.endsWith(".mjs"));
  check("EI1", "every engine file is covered by the drift manifest",
    scripts.filter(n => !["registry.mjs", "known-ids.mjs"].includes(n)).every(n => manifest[`scripts/${n}`]));
  const measurable = new Set([...Object.keys(weights), ...required]);
  const bad = [];
  for (const a of profile.dna_baseline.archetypes)
    for (const m of [a.emphasis, a.penalise || {}]) for (const d of Object.keys(m)) if (!measurable.has(d)) bad.push(`${a.id}.${d}`);
  check("EI2", "every archetype dimension is weighted or required-known", bad.length === 0, bad.join(", "));

  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if ([".git", "node_modules", "site"].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!/\.(mjs|json|yml)$/.test(e.name)) continue;
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (rel === "test/mystery-profile.test.mjs") continue;
      const text = fs.readFileSync(full, "utf8");
      for (const b of ["wtf-scifi", "wtf-fantasy", "wtf-action", "wtf-anime", "wtf-thriller"]) if (text.includes(b)) offenders.push(`${rel} -> ${b}`);
      if (text.includes("wtf-addon-template") && rel !== "test/engine-checksums.json") offenders.push(`${rel} -> template`);
    }
  };
  walk(root);
  check("IN1", "no cross-repo reference or runtime dependency", offenders.length === 0, offenders.join("\n         "));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  check("IN2", "zero dependencies", !pkg.dependencies && !pkg.devDependencies);
}
check("VP1", "the profile validates", validateProfile(profile).length === 0, validateProfile(profile).join("\n         "));
check("VP2", "the thresholds are Mystery-specific, not borrowed", (() => {
  const r = profile.automation_rules;
  const others = [[62, 80], [65, 80], [60, 70], [58, 67], [82, 90]];
  return !others.some(([a, b]) => r.minimum_match_score === a && r.best_match_score === b)
    && /MYSTERY-SPECIFIC/.test(r.calibration_note);
})(), "62/80, 65/80, 60/70, 58/67 and 82/90 belong to other profiles");
check("VP3", "the calibration note names the pool size and the quartiles",
  /95-title pool/.test(profile.automation_rules.calibration_note)
  && /min 50, Q1 65, median 76, Q3 84, max 100/.test(profile.automation_rules.calibration_note));
{
  let ok = true, out = "";
  try { out = execFileSync(process.execPath, ["scripts/validate.mjs"], { cwd: root, encoding: "utf8", stdio: "pipe" }); }
  catch (e) { ok = false; out = `${e.stdout || ""}${e.stderr || ""}`; }
  check("PL1", "validate.mjs succeeds on the real library", ok, out);
  let built = true;
  try { execFileSync(process.execPath, ["scripts/build-site.mjs"], { cwd: root, stdio: "pipe" }); } catch { built = false; }
  check("PL2", "build-site.mjs succeeds", built);
  check("PL3", "the build emits 24 manifest catalogs",
    JSON.parse(fs.readFileSync(path.join(root, "site", "manifest.json"), "utf8")).catalogs.length === 24);
}

console.log("");
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
