# wtf-mystery-stremio

WTF Mystery Discovery - Unexplained phenomena, hidden causes, reality and time puzzles, trapped worlds and twisty murder mysteries that keep revealing meaningful answers instead of drifting into generic procedural or drama.

**Manifest ID:** `com.github.wtfmystery.discovery`

## Catalog rows

- Full Watchlist
- 🔥 Past 24h Findings
- ⭐ Best Matches
- 🧬 DNA Match
- 🌫️ Unexplained Phenomena
- 🌀 Reality / Time / WTF
- 🔒 Trapped & Contained
- 🕵️ Murder & Culprit Hunt
- 🧩 Clues & Puzzles
- 🕸️ Hidden Truths & Conspiracies
- ⚡ High Suspense
- 👁️ Impossible & Supernatural Mysteries

Each row is emitted for both `movie` and `series`, so Stremio shows 24 catalogs.

## Independence

This repository is self-contained. It has no runtime or build-time dependency on
any other WTF Discovery addon, on their GitHub Pages deployments, or on the
scaffold generator that created it. It validates, builds and deploys alone.

## The vendored engine

Everything in `scripts/` except `registry.mjs` and `known-ids.mjs` is vendored
verbatim from the canonical template and **must not be edited here**.
`test/engine-checksum.test.mjs` fails if one of those files changes locally.
Engine changes go into the template first, then get regenerated into every repo.

`registry.mjs` (this addon's frozen DNA vocabulary) and `known-ids.mjs` are
generated once from this addon's own profile and are owned by this repository.

## Commands

```bash
npm test              # full suite, production-state census last
npm run validate      # fail-closed validation of data/ against the profile
npm run build         # build site/ (manifest + catalog JSON)
```

## Prepared publication migration

The research packet pipeline is prepared for a later coordinated cutover.
`RESEARCH_PUBLICATION_ENABLED` remains unset, and the saved 11:30 Europe/Berlin
task and rotator remain unchanged. Complete Thriller's three-cycle publication
acceptance gate before activating Mystery. Follow
[the cutover procedure](docs/publication-cutover.md) when that gate passes.

Research stages only `research-inbox/<date>.json` on `research/<date>-mystery`.
Trusted-main workflows validate and finalize the packet, then use a scoped
GitHub App to create a protected publication PR. Hourly reconciliation recovers
persisted work, reuses unchanged attempts and retains superseded artifacts.
Pages retains its minute-57 hourly rebuild and emits a deployment receipt.
Metadata resolution uses a fully validated maintenance PR.

The baseline score thresholds remain 61/85 with five movies and three series
per day. Mystery retains its own completeness and nullability semantics, three
distinct sources, and TVMaze whole-runtime evidence for series. Existing
history, catalog identities and taste policy remain unchanged. JSON Schema
validation uses the sole pinned dependency, Ajv 8.20.0.

The overall remake also requires automatic private feedback interpretation and
deterministic learning, an intentional cutover with genuinely recomputed state,
and observed effects on later research. Publication stability alone does not
complete that work or authorize personalization activation.
