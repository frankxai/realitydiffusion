import test from 'node:test';
import assert from 'node:assert/strict';

import { INDICATORS, EXTERNAL_FAMILIES, getIndicator } from '../src/engine/indicators.js';
import { FAILURE_MODES } from '../src/engine/failure-modes.js';
import { BANDS, scoreClaim, scoreReport, overallReading, EvidenceEngineError } from '../src/engine/confidence.js';
import { checkStructure, nodeKinds, meta } from '../src/schema/types.js';
import { ADVERSARIAL_SAMPLES, sampleToReport } from '../src/fixtures/adversarial-samples.js';

const M = meta('test');
const AT = '2026-09-02T00:00:00.000Z';

function build({ observations, alternatives = [{ id: 'alt-1', statement: 'The platform stripped it.', status: 'open', meta: M }] }) {
  const obs = observations.map((o, i) => ({
    id: `o${i + 1}`,
    indicatorId: o.indicatorId,
    evidenceId: 'e1',
    state: o.state ?? 'observed',
    toolResultIds: o.toolResultIds ?? [],
    meta: M,
  }));
  return {
    schema: 'RealityCheck.v1',
    id: 'case-1',
    title: 'Case',
    createdAt: AT,
    updatedAt: AT,
    capture: { id: 'c1', surfacedOn: 'a platform', meta: M },
    evidence: [{ id: 'e1', kind: 'image', descriptor: 'a photograph', meta: M }],
    sources: [],
    observations: obs,
    toolResults: [],
    claims: [{
      id: 'cl1',
      statement: 'The material is synthetic rather than a photograph of the scene described.',
      evidenceIds: ['e1'],
      observationIds: obs.map((o) => o.id),
      alternatives,
      meta: M,
    }],
    reviewers: [],
    decision: { id: 'd1', disposition: 'seek-more-evidence', rationale: 'Held open.', meta: M },
    versions: [{ version: 1, at: AT, summary: 'seed', supersedes: null, meta: M }],
  };
}

const score = (report) => scoreClaim(report.claims[0], { observations: report.observations, toolResults: report.toolResults });

test('the catalog is well formed: every indicator carries alternatives, a rule, and a bounded weight', () => {
  assert.ok(INDICATORS.length >= 15, 'catalog should be substantive');
  const ids = new Set();
  const fmIds = new Set(FAILURE_MODES.map((f) => f.id));
  for (const ind of INDICATORS) {
    assert.ok(!ids.has(ind.id), `duplicate indicator id ${ind.id}`);
    ids.add(ind.id);
    assert.ok(ind.alternatives.length >= 1, `${ind.id} ships no alternative explanation`);
    assert.ok(ind.evaluationRule.length > 20, `${ind.id} has no usable evaluation rule`);
    assert.ok(ind.weight >= 1 && ind.weight <= 3, `${ind.id} weight out of range`);
    for (const fm of ind.failureModes ?? []) {
      assert.ok(fmIds.has(fm), `${ind.id} references unknown failure mode ${fm}`);
    }
  }
});

test('the twelve node types are all defined', () => {
  assert.equal(nodeKinds().length, 12);
});

test('a claim with no alternative explanation cannot be scored', () => {
  const report = build({ observations: [{ indicatorId: 'metadata-generator-field' }], alternatives: [] });
  assert.throws(() => score(report), EvidenceEngineError);
});

test('no report can assert certainty: no band exceeds substantial, whatever the evidence', () => {
  const everySyntheticIndicator = INDICATORS
    .filter((i) => i.direction === 'toward-synthetic')
    .map((i) => ({ indicatorId: i.id }));
  const report = build({
    observations: everySyntheticIndicator,
    alternatives: [{ id: 'a1', statement: 'A planted metadata field.', status: 'ruled-out', reason: 'The original was obtained from the capturer.', meta: M }],
  });
  const c = score(report);
  assert.equal(c.band, 'substantial');
  assert.equal(c.cap, 'substantial');
  assert.ok(c.score < 1, 'score is bounded below 1');
  assert.ok(c.residualDoubt.length > 0, 'a scored claim always states what would overturn it');
  assert.ok(!BANDS.includes('certain'), 'there is no certainty band');
});

test('one evidence family alone is capped at weak, however strong', () => {
  const report = build({
    observations: [
      { indicatorId: 'text-render-artifacts' },
      { indicatorId: 'anatomy-continuity-break' },
      { indicatorId: 'physical-implausibility' },
    ],
  });
  const c = score(report);
  assert.equal(c.cap, 'weak');
  assert.equal(c.band, 'weak');
  assert.match(c.capReason, /one evidence family/i);
});

test('appearance-only evidence is capped at moderate even across families', () => {
  const report = build({
    observations: [
      { indicatorId: 'text-render-artifacts' },
      { indicatorId: 'anatomy-continuity-break' },
      { indicatorId: 'voice-prosody-flat', state: 'not-applicable' },
      { indicatorId: 'metadata-generator-field' },
    ],
  });
  const c = score(report);
  const usedFamilies = new Set(report.observations
    .filter((o) => o.state === 'observed')
    .map((o) => getIndicator(o.indicatorId).family));
  assert.ok([...usedFamilies].every((f) => !EXTERNAL_FAMILIES.includes(f)));
  assert.equal(c.cap, 'moderate');
});

test('a detector cannot carry a claim on its own', () => {
  const report = build({ observations: [{ indicatorId: 'detector-flagged-synthetic' }] });
  const c = score(report);
  assert.equal(c.cap, 'weak');
  assert.equal(c.lean, 'toward-synthetic');
});

test('an uncalibrated tool result caps the claim it is cited in', () => {
  const report = build({
    observations: [
      { indicatorId: 'detector-flagged-synthetic', toolResultIds: ['t1'] },
      { indicatorId: 'earlier-copy-exists' },
      { indicatorId: 'metadata-generator-field' },
    ],
    alternatives: [{ id: 'a1', statement: 'Planted metadata.', status: 'ruled-out', reason: 'Original obtained from the capturer.', meta: M }],
  });
  report.toolResults = [{ id: 't1', tool: 'A consumer detector', reported: '94% AI', calibration: 'unknown', meta: M }];
  const capped = score(report);
  assert.equal(capped.cap, 'moderate');
  assert.match(capped.capReason, /no published error rate/i);

  report.toolResults[0].calibration = 'published-benchmark';
  assert.equal(score(report).cap, 'substantial');
});

test('an open alternative explanation keeps a claim below the top band', () => {
  const observations = INDICATORS.filter((i) => i.direction === 'toward-synthetic').map((i) => ({ indicatorId: i.id }));
  const report = build({ observations }); // default alternative is open
  const c = score(report);
  assert.equal(c.cap, 'moderate');
  assert.match(c.capReason, /alternative explanation/i);
});

test('unanswered questions dilute the score rather than being ignored', () => {
  const withUnknowns = build({
    observations: [
      { indicatorId: 'metadata-generator-field' },
      { indicatorId: 'earlier-copy-exists', state: 'unknown' },
      { indicatorId: 'no-independent-corroboration', state: 'unknown' },
    ],
  });
  const without = build({ observations: [{ indicatorId: 'metadata-generator-field' }] });
  assert.ok(score(withUnknowns).score < score(without).score);
  assert.equal(score(withUnknowns).breadth.unknownCount, 2);
  assert.match(score(withUnknowns).residualDoubt, /unanswered/);
});

test('contradicting evidence reads as conflicting, not as a winner', () => {
  const report = build({
    observations: [
      { indicatorId: 'metadata-generator-field' },
      { indicatorId: 'official-record-match' },
    ],
  });
  const c = score(report);
  assert.equal(c.lean, 'conflicting');
  assert.equal(c.band, 'indeterminate');
});

test('scoring is deterministic and does not mutate the report', () => {
  const report = build({ observations: [{ indicatorId: 'earlier-copy-exists' }, { indicatorId: 'exif-absent' }] });
  const a = JSON.stringify(scoreReport(report).claims[0].confidence);
  const b = JSON.stringify(scoreReport(report).claims[0].confidence);
  assert.equal(a, b);
  assert.equal(report.claims[0].confidence, undefined);
});

test('every adversarial sample stays at or below its honest ceiling', () => {
  for (const sample of ADVERSARIAL_SAMPLES) {
    const report = sampleToReport(sample);
    assert.deepEqual(checkStructure(report), { ok: true, errors: [] }, `${sample.id} is not structurally valid`);
    const c = scoreReport(report).claims[0].confidence;
    assert.ok(
      BANDS.indexOf(c.band) <= BANDS.indexOf(sample.expects.maxBand),
      `${sample.id}: band ${c.band} exceeds the honest ceiling ${sample.expects.maxBand}`,
    );
    if (sample.expects.lean) assert.equal(c.lean, sample.expects.lean, `${sample.id} lean`);
  }
});

test('the overall reading never announces a verdict', () => {
  const report = scoreReport(sampleToReport(ADVERSARIAL_SAMPLES[1]));
  const reading = overallReading(report);
  assert.match(reading, /No claim here is settled|does not lean/);
});

test('structure check catches a claim pointing at evidence that is not in the file', () => {
  const report = build({ observations: [{ indicatorId: 'exif-absent' }] });
  report.claims[0].evidenceIds = ['nope'];
  const result = checkStructure(report);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /unknown evidence/);
});
