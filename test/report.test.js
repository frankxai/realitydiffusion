import test from 'node:test';
import assert from 'node:assert/strict';

import { certaintyViolations, flagCertainty, exportMarkdown, exportJson, addVersion, CertaintyError } from '../src/engine/report.js';
import { scoreReport } from '../src/engine/confidence.js';
import { ADVERSARIAL_SAMPLES, sampleToReport } from '../src/fixtures/adversarial-samples.js';
import { meta } from '../src/schema/types.js';

const AT = '2026-09-02T12:00:00.000Z';
const scored = () => scoreReport(sampleToReport(ADVERSARIAL_SAMPLES[1]));

test('certainty language is caught, and its negation is allowed', () => {
  assert.deepEqual(certaintyViolations('This is definitively AI-generated.'), ['definitively']);
  assert.deepEqual(certaintyViolations('100% fake.'), ['100%']);
  assert.deepEqual(certaintyViolations('Confirmed fake by our team.'), ['Confirmed fake']);
  assert.deepEqual(certaintyViolations('This is not conclusive.'), []);
  assert.deepEqual(certaintyViolations('The method never reaches certainty.'), []);
  assert.deepEqual(certaintyViolations('A moderate lean toward synthesis, with two open alternatives.'), []);
});

test('no report can assert certainty: an export refuses to carry it', () => {
  const report = scored();
  report.claims[0].statement = 'This image is definitely AI-generated.';
  const violations = flagCertainty(report);
  assert.ok(violations.length > 0);
  assert.throws(() => exportMarkdown(report, { exportedAt: AT }), CertaintyError);
  assert.throws(() => exportJson(report, { exportedAt: AT }), CertaintyError);
});

test('the exporters own generated prose passes its own certainty guard', () => {
  for (const sample of ADVERSARIAL_SAMPLES) {
    const md = exportMarkdown(scoreReport(sampleToReport(sample)), { exportedAt: AT });
    assert.deepEqual(certaintyViolations(md), [], `${sample.id} export asserts certainty`);
  }
});

test('a markdown export carries the lean, the ceiling, the doubt and the alternatives', () => {
  const md = exportMarkdown(scored(), { exportedAt: AT });
  assert.match(md, /# Reality Check/);
  assert.match(md, /Ceiling: /);
  assert.match(md, /Residual doubt: /);
  assert.match(md, /Alternative explanations/);
  assert.match(md, /Failure modes this review was exposed to/);
  assert.match(md, /no model was run on the media and the media was never uploaded/);
  assert.match(md, /BENCHMARK-PLAN\.md/);
});

test('private nodes never reach an export', () => {
  const report = scored();
  report.sources.push({ id: 's-secret', kind: 'person', label: 'Confidential contact', independence: 'independent', meta: meta('reviewer:1', { visibility: 'private' }) });
  report.reviewers.push({ id: 'r1', handle: 'Private reviewer', role: 'primary', meta: meta('reviewer:1', { visibility: 'private' }) });
  const md = exportMarkdown(report, { exportedAt: AT });
  const json = exportJson(report, { exportedAt: AT });
  assert.doesNotMatch(md, /Confidential contact/);
  assert.doesNotMatch(md, /Private reviewer/);
  assert.equal(json.report.sources.find((s) => s.id === 's-secret'), undefined);
});

test('a json export states that it makes no detection claim, and is versioned', () => {
  const json = exportJson(scored(), { exportedAt: AT });
  assert.equal(json.exportFormat, 'RealityCheckExport.v1');
  assert.equal(json.schema, 'RealityCheck.v1');
  assert.equal(json.reportVersion, 1);
  assert.match(json.engine.detectionClaim, /^none\./);
  assert.equal(json.engine.deterministic, true);
});

test('versions are append-only and each supersedes the last', () => {
  const v2 = addVersion(scored(), { summary: 'Reverse search widened to four engines.', at: AT, owner: 'reviewer:1' });
  assert.equal(v2.versions.length, 2);
  assert.equal(v2.versions[1].version, 2);
  assert.equal(v2.versions[1].supersedes, 1);
  assert.equal(exportJson(v2, { exportedAt: AT }).reportVersion, 2);
});

test('markdown export is byte-identical for identical input', () => {
  assert.equal(exportMarkdown(scored(), { exportedAt: AT }), exportMarkdown(scored(), { exportedAt: AT }));
});
