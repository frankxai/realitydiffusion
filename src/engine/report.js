/**
 * Report export, versioned.
 *
 * Two outputs from one record: Markdown for a human reading the file, JSON for a
 * newsroom or a court bundle that has to keep it. Both refuse to carry certainty
 * language, and both strip nodes the reviewer marked private.
 */

import { SCHEMA_ID, SCHEMA_VERSION } from '../schema/types.js';
import { getIndicator, CATALOG_REVIEWED_AT } from './indicators.js';
import { failureModesFor, FAILURE_MODES } from './failure-modes.js';
import { overallReading, BAND_LABEL } from './confidence.js';
import { INDICATORS } from './indicators.js';

export const EXPORT_FORMAT_VERSION = '1.0.0';

export class CertaintyError extends Error {
  /** @param {string} message @param {Array<{phrase: string, where: string}>} violations */
  constructor(message, violations) {
    super(message);
    this.violations = violations;
  }
}

const CERTAINTY_PATTERNS = [
  /\b(certainty|certainly|conclusive|conclusively|definitive|definitively|proven|guaranteed|undeniable|undeniably|irrefutable|indisputable)\b/gi,
  /\bbeyond (any |all )?doubt\b/gi,
  /\b100\s*%/gi,
  /\b(confirmed|verified) (fake|real|authentic|synthetic|ai[- ]generated)\b/gi,
  /\b(is|was|are) (definitely|certainly|clearly|obviously) (ai|synthetic|fake|generated|real|authentic)\b/gi,
];

const NEGATORS = /\b(no|not|never|without|cannot|can't|isn't|aren't|wasn't|nothing|neither|nor|less than|short of|far from)\b/i;

/**
 * Assertive-certainty findings in a piece of free text. Negated forms — "this is
 * not conclusive", "never reaches certainty" — are allowed, because saying what
 * the method cannot do is the point.
 *
 * @param {string} text
 * @returns {string[]} the offending phrases
 */
export function certaintyViolations(text) {
  if (!text) return [];
  /** @type {string[]} */
  const found = [];
  for (const pattern of CERTAINTY_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const before = text.slice(Math.max(0, match.index - 40), match.index);
      if (NEGATORS.test(before)) continue;
      found.push(match[0]);
    }
  }
  return found;
}

/**
 * Every place in a report where a reviewer asserted certainty. The workbench
 * shows these live; the exporters refuse to run while any remain.
 * @param {import('../schema/types.js').RealityCheckReport} report
 * @returns {Array<{phrase: string, where: string}>}
 */
export function flagCertainty(report) {
  /** @type {Array<{phrase: string, where: string}>} */
  const out = [];
  const check = (text, where) => {
    for (const phrase of certaintyViolations(text)) out.push({ phrase, where });
  };
  check(report.title ?? '', 'title');
  check(report.capture?.claimedOrigin ?? '', 'capture context');
  for (const c of report.claims ?? []) {
    check(c.statement, `claim ${c.id}`);
    check(c.falsifier ?? '', `claim ${c.id} falsifier`);
    for (const a of c.alternatives ?? []) check(a.reason ?? '', `claim ${c.id} alternative ${a.id}`);
  }
  for (const o of report.observations ?? []) check(o.note ?? '', `observation ${o.id}`);
  check(report.decision?.rationale ?? '', 'decision rationale');
  for (const v of report.versions ?? []) check(v.summary, `version ${v.version}`);
  return out;
}

/** @param {import('../schema/types.js').RealityCheckReport} report */
function assertNoCertainty(report) {
  const violations = flagCertainty(report);
  if (violations.length > 0) {
    throw new CertaintyError(
      `This report asserts certainty in ${violations.length} place(s) and cannot be exported: ` +
      violations.map((v) => `"${v.phrase}" in ${v.where}`).join(', ') +
      '. Reality Check reports state a lean, its cap, and what would overturn it.',
      violations,
    );
  }
}

/** @param {import('../schema/types.js').RealityCheckReport} report */
function visible(report) {
  const keep = (n) => n?.meta?.visibility !== 'private';
  return {
    ...report,
    evidence: (report.evidence ?? []).filter(keep),
    sources: (report.sources ?? []).filter(keep),
    observations: (report.observations ?? []).filter(keep),
    toolResults: (report.toolResults ?? []).filter(keep),
    reviewers: (report.reviewers ?? []).filter(keep),
    claims: (report.claims ?? []).filter(keep).map((c) => ({ ...c, alternatives: (c.alternatives ?? []).filter(keep) })),
  };
}

/** @param {import('../schema/types.js').RealityCheckReport} report */
function currentVersion(report) {
  return (report.versions ?? []).reduce((max, v) => Math.max(max, v.version), 0);
}

/**
 * @param {import('../schema/types.js').RealityCheckReport} report
 * @param {{exportedAt: string}} opts the caller owns the clock, so exports are reproducible in tests
 */
export function exportJson(report, opts) {
  assertNoCertainty(report);
  const doc = visible(report);
  return {
    exportFormat: 'RealityCheckExport.v1',
    exportFormatVersion: EXPORT_FORMAT_VERSION,
    schema: SCHEMA_ID,
    schemaVersion: SCHEMA_VERSION,
    reportVersion: currentVersion(report),
    exportedAt: opts.exportedAt,
    engine: {
      name: 'reality-check-evidence-engine',
      deterministic: true,
      indicatorCatalogReviewedAt: CATALOG_REVIEWED_AT,
      detectionClaim: 'none. This engine does not detect synthetic media; it structures a reviewer\'s own evidence and caps what it may conclude.',
    },
    report: doc,
  };
}

/**
 * @param {import('../schema/types.js').RealityCheckReport} report
 * @param {{exportedAt: string}} opts
 * @returns {string}
 */
export function exportMarkdown(report, opts) {
  assertNoCertainty(report);
  const doc = visible(report);
  const L = [];
  const obsById = new Map(doc.observations.map((o) => [o.id, o]));
  const srcById = new Map(doc.sources.map((s) => [s.id, s]));
  const toolById = new Map(doc.toolResults.map((t) => [t.id, t]));

  L.push(`# Reality Check — ${doc.title ?? doc.id}`);
  L.push('');
  L.push(`Report version ${currentVersion(doc)} · exported ${opts.exportedAt} · schema ${SCHEMA_ID}`);
  L.push('');
  L.push('## What this document is');
  L.push('');
  L.push('A record of what one reviewer checked, what they found, and what they could not rule out. It states a lean per claim with an explicit ceiling on how far that lean may be taken. It is not a detection result: no model was run on the media and the media was never uploaded.');
  L.push('');
  L.push(overallReading(doc));
  L.push('');

  L.push('## Capture context');
  L.push('');
  const cap = doc.capture;
  L.push(`- Surfaced on: ${cap.surfacedOn}`);
  L.push(`- Claimed origin: ${cap.claimedOrigin ?? 'not stated'}`);
  L.push(`- Claimed capture time: ${cap.claimedCapturedAt ?? 'not stated'}`);
  L.push(`- Chain of custody: ${cap.chainOfCustody ?? 'unknown'}`);
  L.push(`- Known re-encoding: ${cap.recompression ?? 'unknown'}`);
  L.push('');

  if (doc.evidence.length > 0) {
    L.push('## Material examined');
    L.push('');
    for (const e of doc.evidence) {
      L.push(`- **${e.id}** (${e.kind}) — ${e.descriptor}${e.locator ? ` · seen at ${e.locator}` : ''}`);
    }
    L.push('');
  }

  L.push('## Claims');
  L.push('');
  for (const claim of doc.claims) {
    L.push(`### ${claim.statement}`);
    L.push('');
    if (claim.confidence) {
      const c = claim.confidence;
      L.push(`**${BAND_LABEL[c.band]}** · lean: ${c.lean} · score ${c.score.toFixed(3)}`);
      L.push('');
      L.push(`Ceiling: ${c.cap}. ${c.capReason}`);
      L.push('');
      L.push(`Residual doubt: ${c.residualDoubt}`);
      L.push('');
      if (c.breadth) {
        L.push(`Evidence breadth: ${c.breadth.observationsUsed} observation(s) across ${c.breadth.familiesObserved} evidence family(ies); ${c.breadth.unknownCount} question(s) left unanswered.`);
        L.push('');
      }
    } else {
      L.push('Not scored.');
      L.push('');
    }

    const observations = (claim.observationIds ?? []).map((id) => obsById.get(id)).filter(Boolean);
    if (observations.length > 0) {
      L.push('| Indicator | Family | Answer | Weight | Note | Sources |');
      L.push('| --- | --- | --- | --- | --- | --- |');
      for (const o of observations) {
        const ind = getIndicator(o.indicatorId);
        const sources = (o.sourceIds ?? []).map((s) => srcById.get(s)?.label ?? s).join('; ');
        const tools = (o.toolResultIds ?? []).map((t) => toolById.get(t)?.tool ?? t).join('; ');
        const cite = [sources, tools].filter(Boolean).join(' · ') || '—';
        L.push(`| ${ind?.question ?? o.indicatorId} | ${ind?.family ?? '—'} | ${o.state} | ${ind ? ind.weight : '—'} | ${escapePipes(o.note ?? '—')} | ${escapePipes(cite)} |`);
      }
      L.push('');
    }

    L.push('**Alternative explanations**');
    L.push('');
    for (const alt of claim.alternatives ?? []) {
      L.push(`- [${alt.status}] ${alt.statement}${alt.reason ? ` — ${alt.reason}` : ''}`);
    }
    L.push('');
    if (claim.falsifier) {
      L.push(`**What would settle it:** ${claim.falsifier}`);
      L.push('');
    }
  }

  if (doc.toolResults.length > 0) {
    L.push('## Third-party tool results');
    L.push('');
    L.push('Recorded as claims made by other parties. Reality Check does not vouch for them, and the engine caps how far an uncalibrated result may move a conclusion.');
    L.push('');
    for (const t of doc.toolResults) {
      L.push(`- **${t.tool}${t.toolVersion ? ` ${t.toolVersion}` : ''}** reported: ${t.reported} · calibration: ${t.calibration}${t.benchmarkRef ? ` (${t.benchmarkRef})` : ''}`);
    }
    L.push('');
  }

  if (doc.sources.length > 0) {
    L.push('## Sources consulted');
    L.push('');
    for (const s of doc.sources) {
      L.push(`- ${s.label} (${s.kind}, ${s.independence})${s.locator ? ` — ${s.locator}` : ''}${s.accessedAt ? ` · accessed ${s.accessedAt}` : ''}`);
    }
    L.push('');
  }

  const usedIndicatorIds = [...new Set(doc.observations.map((o) => o.indicatorId))];
  const modes = failureModesFor(usedIndicatorIds, INDICATORS);
  if (modes.length > 0) {
    L.push('## Failure modes this review was exposed to');
    L.push('');
    for (const m of modes) {
      L.push(`- **${m.name}** — ${m.what} Guard applied: ${m.guard}`);
    }
    L.push('');
  }

  L.push('## Decision');
  L.push('');
  L.push(`**${doc.decision.disposition}** — ${doc.decision.rationale}`);
  L.push('');
  if ((doc.decision.nextEvidenceSought ?? []).length > 0) {
    L.push('Evidence still sought:');
    L.push('');
    for (const n of doc.decision.nextEvidenceSought) L.push(`- ${n}`);
    L.push('');
  }

  if (doc.reviewers.length > 0) {
    L.push('## Reviewers');
    L.push('');
    for (const r of doc.reviewers) {
      L.push(`- ${r.handle} (${r.role})${r.declaredInterest ? ` — declared interest: ${r.declaredInterest}` : ' — no declared interest'}`);
    }
    L.push('');
  }

  L.push('## Version history');
  L.push('');
  for (const v of [...doc.versions].sort((a, b) => a.version - b.version)) {
    L.push(`- v${v.version} · ${v.at} — ${v.summary}${v.supersedes ? ` (supersedes v${v.supersedes})` : ''}`);
  }
  L.push('');

  L.push('## Method and limits');
  L.push('');
  L.push(`- Indicator catalog last reviewed against current generator output on ${CATALOG_REVIEWED_AT}. Content-level indicators decay; check that date before relying on them.`);
  L.push('- The engine is deterministic and runs entirely in the reviewer\'s browser. No media, metadata or text left the device.');
  L.push('- Reality Diffusion makes no synthetic-media detection claim. The evidence required before any such claim could be made is written down in BENCHMARK-PLAN.md.');
  L.push(`- ${FAILURE_MODES.length} known failure modes are catalogued with this method; the ones relevant to this file are listed above.`);
  L.push('');

  return L.join('\n');
}

/**
 * Appends a version entry. Versions are append-only: an export that has left the
 * building cannot be edited, only superseded.
 * @param {import('../schema/types.js').RealityCheckReport} report
 * @param {{summary: string, at: string, owner: string}} entry
 */
export function addVersion(report, entry) {
  const next = currentVersion(report) + 1;
  return {
    ...report,
    updatedAt: entry.at,
    versions: [
      ...(report.versions ?? []),
      {
        version: next,
        at: entry.at,
        summary: entry.summary,
        supersedes: next > 1 ? next - 1 : null,
        meta: { owner: entry.owner, provenance: 'reviewer-entered', version: SCHEMA_VERSION, visibility: 'report' },
      },
    ],
  };
}

/** @param {string} s */
function escapePipes(s) { return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' '); }
