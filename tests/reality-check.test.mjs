import test from "node:test";
import assert from "node:assert/strict";

import { evaluateRealityCheck } from "../lib/reality-check.mjs";

const weakEvidence = {
  sourceKnown: false,
  contextConsistent: false,
  provenancePresent: false,
  independentlyCorroborated: false,
  manipulationSignalsAbsent: false,
};

const strongEvidence = {
  sourceKnown: true,
  contextConsistent: true,
  provenancePresent: true,
  independentlyCorroborated: true,
  manipulationSignalsAbsent: true,
};

test("classifies unsupported media as high risk", () => {
  const result = evaluateRealityCheck(weakEvidence);

  assert.equal(result.classification, "high-risk");
  assert.equal(result.score, 0);
  assert.ok(result.nextActions.includes("Find the earliest available source."));
});

test("classifies a fully evidenced item as strong evidence", () => {
  const result = evaluateRealityCheck(strongEvidence);

  assert.equal(result.classification, "strong-evidence");
  assert.equal(result.score, 100);
  assert.deepEqual(result.nextActions, [
    "Preserve the source and provenance record.",
    "Re-check if the media or surrounding claim changes.",
  ]);
});

test("keeps a manipulation signal in high risk regardless of other evidence", () => {
  const result = evaluateRealityCheck({
    ...strongEvidence,
    manipulationSignalsAbsent: false,
  });

  assert.equal(result.classification, "high-risk");
  assert.equal(result.score, 55);
  assert.ok(result.nextActions.includes("Inspect for editing or generation artifacts."));
});

test("does not mutate the submitted evidence", () => {
  const evidence = { ...strongEvidence };
  const before = structuredClone(evidence);

  evaluateRealityCheck(evidence);

  assert.deepEqual(evidence, before);
});
