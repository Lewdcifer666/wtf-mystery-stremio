// GENERATED ONCE AT SCAFFOLD TIME - this repo's frozen DNA vocabulary.
//
// This is the one file the generator writes from the profile rather than
// copying verbatim, and it is what lets validate-profile.mjs stay genre-neutral
// and vendored. The guard it feeds is deliberately strict: data/taste-profile.json
// must declare EXACTLY these dimensions and EXACTLY these tags, no more and no
// fewer, so a typo becomes a loud failure instead of quiet new metadata.
//
// Changing this list is a schema decision. It means a registry version bump, a
// migration for every already-enriched record, and a review of every consumer -
// never a casual edit.

export const CANONICAL_DIMENSIONS = [
  "central_mystery",
  "mystery_density",
  "unexplained_phenomenon",
  "cause_uncertainty",
  "investigation",
  "clue_puzzling",
  "culprit_hunt",
  "progressive_revelation",
  "revelation_frequency",
  "plot_twists",
  "misdirection",
  "suspense",
  "hidden_truth",
  "conspiracy_coverup",
  "containment",
  "unknown_rules",
  "time_anomaly",
  "reality_uncertainty",
  "memory_identity_uncertainty",
  "scientific_cause",
  "supernatural_cause",
  "paranormal_horror_focus",
  "horror_focus",
  "survival_pressure",
  "weirdness",
  "drama_focus",
  "romance_focus",
  "visual_quality",
  "retro_visual_style",
  "pace_speed"
];

export const CANONICAL_DNA_TAGS = [
  "whodunit",
  "closed_circle",
  "detective_lead",
  "serial_killer",
  "cold_case",
  "disappearance",
  "small_town",
  "island_or_remote",
  "sealed_barrier",
  "time_loop",
  "parallel_timeline",
  "amnesia",
  "secret_organization",
  "human_experiment",
  "contagion",
  "environmental_event",
  "screenlife",
  "cult",
  "haunting",
  "anthology_case"
];

// The single deliberate exception to the shared absent..dominant scale:
// pace_speed measures slow..fast. Exactly one dimension may be slow_to_fast.
export const SLOW_TO_FAST_DIMENSION = "pace_speed";
