/**
 * RealityCheck.v1 node types.
 *
 * The JSON Schema in `reality-check.v1.schema.json` is the contract; these JSDoc
 * typedefs are the same contract for editors and for `checkStructure` below,
 * which enforces only the invariants that make a report honest. Full schema
 * validation is a consumer's job and needs no dependency here.
 */

export const SCHEMA_ID = 'RealityCheck.v1';
export const SCHEMA_VERSION = '1.0.0';

/**
 * @typedef {'private'|'report'|'public'} Visibility
 * @typedef {'reviewer-entered'|'catalog'|'tool-reported'|'third-party-claim'|'derived'} Provenance
 *
 * @typedef {object} NodeMeta
 * @property {string} owner
 * @property {Provenance} provenance
 * @property {string} version
 * @property {Visibility} visibility
 *
 * @typedef {object} EvidenceItem
 * @property {string} id
 * @property {'image'|'video'|'audio'|'text'|'document'|'composite'} kind
 * @property {string} descriptor
 * @property {string|null} [locator]
 * @property {string|null} [firstSeenAt]
 * @property {NodeMeta} meta
 *
 * @typedef {object} CaptureContext
 * @property {string} id
 * @property {string} surfacedOn
 * @property {string|null} [claimedOrigin]
 * @property {string|null} [claimedCapturedAt]
 * @property {'direct-from-source'|'one-hop'|'multi-hop'|'unknown'} [chainOfCustody]
 * @property {'none-known'|'platform-reencoded'|'screenshot-of-screen'|'unknown'} [recompression]
 * @property {NodeMeta} meta
 *
 * @typedef {object} Source
 * @property {string} id
 * @property {'publication'|'official-record'|'platform-page'|'person'|'archive'|'reverse-search'|'other'} kind
 * @property {string} label
 * @property {string|null} [locator]
 * @property {'independent'|'shares-origin'|'unknown'} independence
 * @property {string|null} [accessedAt]
 * @property {NodeMeta} meta
 *
 * @typedef {object} Indicator
 * @property {string} id
 * @property {'provenance'|'metadata'|'distribution'|'content'|'signal'|'corroboration'} family
 * @property {'presence'|'absence'} [basis]
 * @property {Array<'image'|'video'|'audio'|'text'|'document'|'composite'>} appliesTo
 * @property {string} question
 * @property {'toward-synthetic'|'toward-authentic'} direction
 * @property {1|2|3} weight
 * @property {string} evaluationRule
 * @property {string[]} alternatives
 * @property {string} teaching
 * @property {string[]} [failureModes]
 * @property {NodeMeta} meta
 *
 * @typedef {object} Observation
 * @property {string} id
 * @property {string} indicatorId
 * @property {string} evidenceId
 * @property {'observed'|'absent'|'unknown'|'not-applicable'} state
 * @property {string} [note]
 * @property {string[]} [sourceIds]
 * @property {string[]} [toolResultIds]
 * @property {string|null} [recordedAt]
 * @property {NodeMeta} meta
 *
 * @typedef {object} ToolResult
 * @property {string} id
 * @property {string} tool
 * @property {string|null} [toolVersion]
 * @property {string} reported
 * @property {'published-benchmark'|'vendor-claim-only'|'unknown'} calibration
 * @property {string|null} [benchmarkRef]
 * @property {NodeMeta} meta
 *
 * @typedef {object} AlternativeExplanation
 * @property {string} id
 * @property {string} statement
 * @property {'open'|'weakened'|'ruled-out'} status
 * @property {string} [reason]
 * @property {NodeMeta} meta
 *
 * @typedef {'indeterminate'|'weak'|'moderate'|'substantial'} Band
 *
 * @typedef {object} Confidence
 * @property {Band} band
 * @property {'toward-synthetic'|'toward-authentic'|'conflicting'|'none'} lean
 * @property {number} score
 * @property {Band} cap
 * @property {string} capReason
 * @property {string} residualDoubt
 * @property {{familiesObserved:number, observationsUsed:number, unknownCount:number}} [breadth]
 *
 * @typedef {object} Claim
 * @property {string} id
 * @property {string} statement
 * @property {string[]} evidenceIds
 * @property {string[]} observationIds
 * @property {AlternativeExplanation[]} alternatives
 * @property {Confidence} [confidence]
 * @property {string} [falsifier]
 * @property {NodeMeta} meta
 *
 * @typedef {object} Reviewer
 * @property {string} id
 * @property {string} handle
 * @property {'primary'|'second-reviewer'|'subject-matter'|'observer'} role
 * @property {string|null} [declaredInterest]
 * @property {NodeMeta} meta
 *
 * @typedef {object} Decision
 * @property {string} id
 * @property {'insufficient-evidence'|'seek-more-evidence'|'hold-do-not-publish'|'publish-with-caveats'|'escalate-to-specialist'} disposition
 * @property {string} rationale
 * @property {string[]} [nextEvidenceSought]
 * @property {string|null} [decidedBy]
 * @property {string|null} [decidedAt]
 * @property {NodeMeta} meta
 *
 * @typedef {object} ReportVersion
 * @property {number} version
 * @property {string} at
 * @property {string} summary
 * @property {number|null} [supersedes]
 * @property {NodeMeta} meta
 *
 * @typedef {object} RealityCheckReport
 * @property {'RealityCheck.v1'} schema
 * @property {string} id
 * @property {string} [title]
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {CaptureContext} capture
 * @property {EvidenceItem[]} [evidence]
 * @property {Source[]} sources
 * @property {Observation[]} observations
 * @property {ToolResult[]} [toolResults]
 * @property {Claim[]} claims
 * @property {Reviewer[]} reviewers
 * @property {Decision} decision
 * @property {ReportVersion[]} versions
 */

/** @param {string} owner @param {Partial<NodeMeta>} [over] @returns {NodeMeta} */
export function meta(owner, over = {}) {
  return {
    owner,
    provenance: 'reviewer-entered',
    version: SCHEMA_VERSION,
    visibility: 'report',
    ...over,
  };
}

const NODE_KINDS = [
  'EvidenceItem', 'Observation', 'Claim', 'Indicator', 'Source', 'CaptureContext',
  'ToolResult', 'Confidence', 'AlternativeExplanation', 'Reviewer', 'Decision', 'ReportVersion',
];

/** The twelve node types this schema defines, in the order the product teaches them. */
export function nodeKinds() {
  return [...NODE_KINDS];
}

/**
 * Structural invariants that keep a report honest. Not a JSON Schema validator:
 * it checks the things whose absence would let the product lie.
 *
 * @param {RealityCheckReport} report
 * @returns {{ok: boolean, errors: string[]}}
 */
export function checkStructure(report) {
  const errors = [];
  const fail = (m) => errors.push(m);

  if (!report || typeof report !== 'object') return { ok: false, errors: ['report is not an object'] };
  if (report.schema !== SCHEMA_ID) fail(`schema must be ${SCHEMA_ID}`);
  if (!Array.isArray(report.claims) || report.claims.length === 0) fail('a report needs at least one claim');
  if (!Array.isArray(report.versions) || report.versions.length === 0) fail('a report needs at least one version entry');
  if (!report.decision) fail('a report needs a decision');
  if (!report.capture) fail('a report needs a capture context');

  const evidenceIds = new Set((report.evidence ?? []).map((e) => e.id));
  const sourceIds = new Set((report.sources ?? []).map((s) => s.id));
  const observationIds = new Set((report.observations ?? []).map((o) => o.id));
  const toolIds = new Set((report.toolResults ?? []).map((t) => t.id));

  for (const node of allNodes(report)) {
    const m = node.meta;
    if (!m) { fail(`node ${node.id ?? '(unnamed)'} has no meta`); continue; }
    for (const key of ['owner', 'provenance', 'version', 'visibility']) {
      if (!m[key]) fail(`node ${node.id ?? '(unnamed)'} meta is missing ${key}`);
    }
  }

  for (const o of report.observations ?? []) {
    if (!evidenceIds.has(o.evidenceId)) fail(`observation ${o.id} points at unknown evidence ${o.evidenceId}`);
    for (const sid of o.sourceIds ?? []) if (!sourceIds.has(sid)) fail(`observation ${o.id} cites unknown source ${sid}`);
    for (const tid of o.toolResultIds ?? []) if (!toolIds.has(tid)) fail(`observation ${o.id} cites unknown tool result ${tid}`);
  }

  for (const c of report.claims ?? []) {
    if (!Array.isArray(c.alternatives) || c.alternatives.length === 0) {
      fail(`claim ${c.id} carries no alternative explanation; every claim must survive at least one`);
    }
    for (const alt of c.alternatives ?? []) {
      if (alt.status !== 'open' && !alt.reason) fail(`alternative ${alt.id} on claim ${c.id} was closed without a reason`);
    }
    if (!Array.isArray(c.evidenceIds) || c.evidenceIds.length === 0) fail(`claim ${c.id} points at no evidence`);
    for (const eid of c.evidenceIds ?? []) if (!evidenceIds.has(eid)) fail(`claim ${c.id} points at unknown evidence ${eid}`);
    for (const oid of c.observationIds ?? []) if (!observationIds.has(oid)) fail(`claim ${c.id} cites unknown observation ${oid}`);
  }

  return { ok: errors.length === 0, errors };
}

/** @param {RealityCheckReport} report */
function* allNodes(report) {
  if (report.capture) yield report.capture;
  if (report.decision) yield report.decision;
  yield* report.evidence ?? [];
  yield* report.sources ?? [];
  yield* report.observations ?? [];
  yield* report.toolResults ?? [];
  yield* report.reviewers ?? [];
  yield* report.versions ?? [];
  for (const c of report.claims ?? []) {
    yield c;
    yield* c.alternatives ?? [];
  }
}
