/**
 * The evidence engine.
 *
 * Deterministic: same observations in, same bands out, no clock, no randomness,
 * no network. The engine's whole job is to refuse the answer the user wants.
 * It produces a banded lean with an explicit cap and a residual-doubt sentence,
 * and it structurally cannot produce "AI-generated: yes".
 *
 * The caps, not the arithmetic, are the product. A high score is meaningless if
 * every observation came from staring at the pixels, so breadth of evidence
 * families is what unlocks the higher bands.
 */

import { getIndicator, EXTERNAL_FAMILIES } from './indicators.js';

/** @typedef {import('../schema/types.js').Band} Band */

export const BANDS = /** @type {const} */ (['indeterminate', 'weak', 'moderate', 'substantial']);

export const BAND_LABEL = {
  indeterminate: 'Indeterminate — the evidence does not lean',
  weak: 'Weak lean — suggestive, not reportable on its own',
  moderate: 'Moderate lean — reportable with the caveats attached',
  substantial: 'Substantial lean — the strongest this method supports; still not certainty',
};

/** Prior mass. Keeps one strong observation from reaching the top band alone. */
const PRIOR = 2;
const DEADBAND = 0.05;

/** @param {Band} a @param {Band} b */
function lowerBand(a, b) {
  return BANDS.indexOf(a) <= BANDS.indexOf(b) ? a : b;
}

/** @param {number} score */
function rawBand(score) {
  const m = Math.abs(score);
  if (m < 0.2) return 'indeterminate';
  if (m < 0.4) return 'weak';
  if (m < 0.65) return 'moderate';
  return 'substantial';
}

export class EvidenceEngineError extends Error {}

/**
 * @param {import('../schema/types.js').Claim} claim
 * @param {{observations: import('../schema/types.js').Observation[], toolResults?: import('../schema/types.js').ToolResult[], indicatorLookup?: (id: string) => import('../schema/types.js').Indicator|undefined}} context
 * @returns {import('../schema/types.js').Confidence}
 */
export function scoreClaim(claim, context) {
  const lookup = context.indicatorLookup ?? getIndicator;
  if (!Array.isArray(claim.alternatives) || claim.alternatives.length === 0) {
    throw new EvidenceEngineError(
      `claim ${claim.id} cannot be scored: it carries no alternative explanation. ` +
      'Every claim must name at least one innocent account of the same observations.',
    );
  }

  const byId = new Map(context.observations.map((o) => [o.id, o]));
  const used = (claim.observationIds ?? []).map((id) => byId.get(id)).filter(Boolean);
  const toolById = new Map((context.toolResults ?? []).map((t) => [t.id, t]));

  let support = 0;
  let counter = 0;
  let unknownCount = 0;
  const families = new Set();
  const externalFamilies = new Set();
  let anyUncalibratedTool = false;
  let anyCalibratedTool = false;
  let nonSignalWeight = 0;
  let presenceWeight = 0;

  for (const obs of used) {
    if (obs.state === 'unknown') { unknownCount += 1; continue; }
    if (obs.state !== 'observed') continue;
    const ind = lookup(obs.indicatorId);
    if (!ind) throw new EvidenceEngineError(`observation ${obs.id} names indicator ${obs.indicatorId}, which is not in the catalog`);

    families.add(ind.family);
    if (EXTERNAL_FAMILIES.includes(ind.family)) externalFamilies.add(ind.family);
    if (ind.family !== 'signal') nonSignalWeight += ind.weight;
    if (ind.basis !== 'absence') presenceWeight += ind.weight;

    for (const tid of obs.toolResultIds ?? []) {
      const tool = toolById.get(tid);
      if (!tool) continue;
      if (tool.calibration === 'published-benchmark') anyCalibratedTool = true;
      else anyUncalibratedTool = true;
    }

    if (ind.direction === 'toward-synthetic') support += ind.weight;
    else counter += ind.weight;
  }

  const denominator = support + counter + PRIOR + unknownCount;
  const score = round3((support - counter) / denominator);

  /** @type {import('../schema/types.js').Confidence['lean']} */
  let lean;
  if (Math.abs(score) < DEADBAND) lean = support > 0 && counter > 0 ? 'conflicting' : 'none';
  else lean = score > 0 ? 'toward-synthetic' : 'toward-authentic';

  const openAlternatives = claim.alternatives.filter((a) => a.status === 'open');

  /** @type {Array<{cap: Band, reason: string}>} */
  const caps = [{ cap: 'substantial', reason: 'This method never reaches certainty; substantial is the ceiling by design.' }];

  if (families.size < 2) {
    caps.push({
      cap: 'weak',
      reason: `Only ${families.size === 0 ? 'no' : 'one'} evidence family was observed. A lean needs corroboration from a second kind of evidence before it can carry weight.`,
    });
  }
  if (externalFamilies.size === 0) {
    caps.push({
      cap: 'moderate',
      reason: 'No provenance, distribution or corroboration evidence was recorded. A judgement resting only on how the media looks or sounds is capped here.',
    });
  }
  if (presenceWeight === 0 && (support > 0 || counter > 0)) {
    caps.push({
      cap: 'weak',
      reason: 'Every observation used records something that is missing — metadata, corroboration, room tone. Absence is usually a fact about platforms and about how recently you looked, so it is capped here.',
    });
  }
  if (nonSignalWeight === 0 && (support > 0 || counter > 0)) {
    caps.push({
      cap: 'weak',
      reason: 'Every observation used came from a detector or signal reading. Third-party tool output cannot carry a claim on its own in this product.',
    });
  }
  if (anyUncalibratedTool && !anyCalibratedTool) {
    caps.push({
      cap: 'moderate',
      reason: 'The tool results cited have no published error rate for media like this, so their contribution is capped.',
    });
  }
  if (openAlternatives.length > 0) {
    caps.push({
      cap: 'moderate',
      reason: `${openAlternatives.length} alternative explanation${openAlternatives.length === 1 ? ' remains' : 's remain'} open. An unexamined innocent account keeps a claim below the top band.`,
    });
  }

  const effective = caps.reduce((acc, c) => lowerBand(acc, c.cap), 'substantial');
  const binding = caps.filter((c) => c.cap === effective).at(-1) ?? caps[0];
  const band = lowerBand(rawBand(score), effective);

  return {
    band,
    lean,
    score,
    cap: effective,
    capReason: binding.reason,
    residualDoubt: residualDoubt({ lean, band, openAlternatives, unknownCount, families }),
    breadth: {
      familiesObserved: families.size,
      observationsUsed: used.filter((o) => o.state === 'observed').length,
      unknownCount,
    },
  };
}

/**
 * @param {{lean: import('../schema/types.js').Confidence['lean'], band: Band, openAlternatives: import('../schema/types.js').AlternativeExplanation[], unknownCount: number, families: Set<string>}} input
 */
function residualDoubt(input) {
  const parts = [];
  if (input.openAlternatives.length > 0) {
    parts.push(`this lean is wrong if ${input.openAlternatives.map((a) => lowerFirst(a.statement)).join('; or if ')}`);
  } else {
    parts.push('this lean is wrong if an alternative explanation was ruled out on incomplete information');
  }
  if (input.unknownCount > 0) {
    parts.push(`${input.unknownCount} question${input.unknownCount === 1 ? ' was' : 's were'} left unanswered and could move the result either way`);
  }
  if (input.band === 'indeterminate') {
    parts.push('the recorded evidence does not distinguish between the accounts on offer');
  }
  return `${capitalise(parts.join(', and '))}.`;
}

/**
 * Scores every claim in a report and returns a new report. Pure: the input is
 * not mutated, and no timestamp is generated here — the caller owns the clock.
 *
 * @param {import('../schema/types.js').RealityCheckReport} report
 * @returns {import('../schema/types.js').RealityCheckReport}
 */
export function scoreReport(report) {
  return {
    ...report,
    claims: report.claims.map((claim) => ({
      ...claim,
      confidence: scoreClaim(claim, {
        observations: report.observations ?? [],
        toolResults: report.toolResults ?? [],
      }),
    })),
  };
}

/**
 * The one-line overall reading. It describes the state of the file, not the
 * media: a Reality Check is a record of what was checked, not a verdict.
 * @param {import('../schema/types.js').RealityCheckReport} report
 */
export function overallReading(report) {
  const scored = report.claims.filter((c) => c.confidence);
  if (scored.length === 0) return 'No claim in this report has been scored.';
  const strongest = scored.reduce((a, b) =>
    BANDS.indexOf(b.confidence.band) > BANDS.indexOf(a.confidence.band) ? b : a,
  );
  const { band, lean } = strongest.confidence;
  if (band === 'indeterminate' || lean === 'none') {
    return `Across ${scored.length} claim${scored.length === 1 ? '' : 's'}, the evidence recorded here does not lean. That is a finding about the evidence, not about the media.`;
  }
  const direction = lean === 'conflicting'
    ? 'in conflicting directions'
    : lean === 'toward-synthetic'
      ? 'toward the media being synthetic or manipulated'
      : 'toward the media being what it is claimed to be';
  return `The strongest claim in this report shows a ${band} lean ${direction}. No claim here is settled, and every one names what would overturn it.`;
}

/** @param {number} n */
function round3(n) { return Math.round(n * 1000) / 1000; }
/** @param {string} s */
function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
/** @param {string} s */
function lowerFirst(s) { return s.charAt(0).toLowerCase() + s.slice(1).replace(/\.$/, ''); }
