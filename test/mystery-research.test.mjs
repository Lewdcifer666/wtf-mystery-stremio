// Exercise the actual Mystery policy through packet intake and finalization.
// Shared packet null support must not silently change this profile's eligibility.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateResearchPacket } from '../scripts/validate-research-packet.mjs';
import { finalizeResearch, loadFinalizerInputs } from '../scripts/finalize-research.mjs';
import { makePolicy, scoreItem } from '../scripts/dna-score.mjs';
import { fixture, clone, options, inFixture } from './fixtures/research/helpers.mjs';

const { inputs, packet } = fixture();
const validate = value => validateResearchPacket(value, { ...inputs, now: options.now });
const finalize = (value, state = inputs) => finalizeResearch(value, state, options);
assert.equal(inputs.research.genre, 'mystery');
assert.equal(inputs.research.require_all_known, false);
assert.equal(inputs.research.minimum_sources, 3);
assert.equal(inputs.research.require_non_metadata_source, true);
assert.deepEqual(inputs.research.required_source_hosts_by_type, { series: ['tvmaze.com'] });
assert.equal(inputs.profile.dna_baseline.completeness_defaults.min_known_dimensions, 22);
assert.equal(inputs.profile.automation_rules.minimum_match_score, 61);
assert.equal(inputs.profile.automation_rules.best_match_score, 85);

const movie = clone(packet);
movie.candidates[0].sources = movie.candidates[0].sources.filter(s => !s.url.includes('tvmaze.com'));
assert.equal(movie.candidates[0].sources.length, 3);
assert.deepEqual(validate(movie), []);
assert.equal(finalize(movie).log.accepted, 1);
const few = clone(movie); few.candidates[0].sources.pop();
assert.ok(validate(few).some(e => e.includes('requires 3 distinct sources')));
const metadata = clone(movie);
metadata.candidates[0].sources = ['one', 'two', 'three'].map(id => ({
  url: `https://v3-cinemeta.strem.io/meta/movie/${id}.json`, purpose: 'identity'
}));
assert.ok(validate(metadata).some(e => e.includes('requires non-metadata evidence')));

const series = clone(movie); series.candidates[0].type = 'series';
assert.ok(validate(series).some(e => e.includes('series requires a source from tvmaze.com')));
for (const spoof of ['https://tvmaze.com.example.org/shows/1', 'https://example.org/tvmaze.com', 'https://not-tvmaze.com/shows/1']) {
  series.candidates[0].sources[1] = { url: spoof, purpose: 'whole_runtime' };
  assert.ok(validate(series).some(e => e.includes('series requires a source from tvmaze.com')));
}
series.candidates[0].sources[1] = { url: 'https://www.tvmaze.com/shows/1/episodes', purpose: 'whole_runtime' };
assert.deepEqual(validate(series), []);
assert.equal(finalize(series).log.accepted, 1);

const row = inputs.catalogs.catalogs.find(c => c.id === 'dna-match');
const policy = makePolicy(inputs.profile);
const baseline = finalize(movie);
assert.equal(baseline.discovery.items[0].match_score, scoreItem(policy, row, movie.candidates[0], new Map()).score);
const dimensions = inputs.profile.dna_dimensions.dimensions.map(d => d.id);
const weighted = new Set(Object.keys(inputs.profile.dna_baseline.weights));
assert.equal(weighted.size, 29);
assert.deepEqual(dimensions.filter(d => !weighted.has(d)), ['pace_speed']);
assert.ok(inputs.profile.dna_baseline.completeness_defaults.required_known_dimensions.includes('pace_speed'));
for (const dimension of dimensions) {
  const unknown = clone(movie); unknown.candidates[0].dna[dimension] = null;
  assert.deepEqual(validate(unknown), [], `Packet null representation: ${dimension}`);
  assert.equal(scoreItem(policy, row, unknown.candidates[0], new Map()).score, null, dimension);
  const result = finalize(unknown);
  assert.equal(result.log.accepted, 0, `Profile eligibility: ${dimension}`);
  assert.equal(result.log.rejected, 1);
  assert.equal(result.discovery, null);
  assert.equal(unknown.candidates[0].dna[dimension], null, `Never coerce unknown ${dimension} to zero`);
}

// The same researched candidate becomes excluded when the user adds a rejection
// before trusted finalization loads fresh repository inputs. No score can undo it.
await inFixture(async root => {
  const before = loadFinalizerInputs(root);
  assert.equal(finalize(movie, before).log.accepted, 1);
  const rejectionPath = path.join(root, 'data/rejections.json');
  const rejections = JSON.parse(fs.readFileSync(rejectionPath, 'utf8'));
  const { imdb_id, type, title, year } = movie.candidates[0];
  rejections.items.push({ imdb_id, type, title, year, user_position: 'Synthetic explicit test rejection' });
  fs.writeFileSync(rejectionPath, JSON.stringify(rejections));
  const after = finalize(movie, loadFinalizerInputs(root));
  assert.equal(after.log.accepted, 0);
  assert.equal(after.log.rejection_summary[0].reason, 'explicit_rejection');
});
console.log('Mystery research: provenance, profile-specific null eligibility, exact scores and fresh rejections passed');
