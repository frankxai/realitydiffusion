/**
 * Failure modes: the ways this work goes wrong, as typed data rather than prose.
 *
 * The workbench surfaces the relevant entry next to the indicator that triggers
 * it, and the exported report lists every failure mode the reviewer's own
 * observations exposed them to. Teaching is a product feature here, not
 * documentation: a reviewer who learns the failure modes needs the tool less.
 */

/**
 * @typedef {object} FailureMode
 * @property {string} id
 * @property {string} name
 * @property {'reasoning'|'technical'|'social'|'temporal'} category
 * @property {string} what        What goes wrong.
 * @property {string} why         Why it is easy to fall into.
 * @property {string} guard       What the reviewer does instead.
 * @property {'high'|'medium'|'low'} frequency  How often it shows up in practice.
 */

/** @type {FailureMode[]} */
export const FAILURE_MODES = [
  {
    id: 'vibe-based-judgement',
    name: 'Judging by feel',
    category: 'reasoning',
    what: 'The reviewer concludes the media is synthetic because it "looks off", without naming an object, a region, or a rule.',
    why: 'Generated media does often feel wrong, so the instinct has real signal — but it is unfalsifiable, unteachable, and it fires hardest on unfamiliar people, places and cultures.',
    guard: 'Convert every impression into a named object and a stated inconsistency another reviewer can check, or discard it. Reality Check will not score an observation without one.',
    frequency: 'high',
  },
  {
    id: 'absence-read-as-evidence',
    name: 'Reading absence as evidence',
    category: 'reasoning',
    what: 'Missing metadata, missing corroboration, or a missing original is counted as a point toward synthesis.',
    why: 'The absence is real and it is frustrating, so it feels informative. Usually it is a fact about platforms and about how recently you searched.',
    guard: 'Record absence with a timestamp and a search scope. Weight it at most one point, and re-check it before the report is used.',
    frequency: 'high',
  },
  {
    id: 'platform-pipeline-mistaken-for-tampering',
    name: 'Blaming the pipeline on the author',
    category: 'technical',
    what: 'Re-encoding, stripping, resizing and signature breakage from ordinary platform processing are read as manipulation.',
    why: 'The artifacts genuinely resemble tampering, and the reviewer usually only ever sees the platform copy.',
    guard: 'Establish what the file passed through before you interpret anything it carries. Prefer chasing the original over interpreting the copy.',
    frequency: 'high',
  },
  {
    id: 'compression-mistaken-for-artifact',
    name: 'Compression read as generation',
    category: 'technical',
    what: 'Mushed text, blocky edges and smeared detail from heavy compression are recorded as generator artifacts.',
    why: 'Both destroy fine detail, and the reviewer is often looking at a screenshot of a screenshot.',
    guard: 'Judge content indicators only on the highest-resolution copy you can obtain, and record which copy you used.',
    frequency: 'high',
  },
  {
    id: 'artifact-catalogue-decays',
    name: 'Yesterday\'s tells',
    category: 'temporal',
    what: 'The reviewer applies artifact rules — hands, teeth, text, eyes — that current models no longer produce.',
    why: 'The rules were widely taught, they were true, and nothing announces when they expire.',
    guard: 'Check the catalog review date, treat clean output as no evidence whatsoever, and never treat the absence of a known artifact as evidence of authenticity.',
    frequency: 'high',
  },
  {
    id: 'detector-treated-as-oracle',
    name: 'Detector as oracle',
    category: 'technical',
    what: 'A percentage from a detection service is carried into the conclusion as if it were a measurement.',
    why: 'A number with a decimal point looks like evidence, and vendors report accuracy on curated benchmarks that do not resemble the open web.',
    guard: 'Record detector output as a third-party claim with tool, version and calibration status. Never let it be the strongest thing in the file.',
    frequency: 'high',
  },
  {
    id: 'unbenchmarked-tool-borrowed-authority',
    name: 'Borrowed authority',
    category: 'technical',
    what: 'A tool with no published error rate on media like this is quoted as if it had one.',
    why: 'Marketing pages state accuracy figures without stating the distribution they were measured on.',
    guard: 'Demand the benchmark reference. With none, mark calibration "unknown" and accept the engine\'s cap.',
    frequency: 'medium',
  },
  {
    id: 'synthesis-assumed-where-recontextualisation-explains',
    name: 'Missing the simpler lie',
    category: 'reasoning',
    what: 'A genuine old photograph presented as today\'s news is investigated as a generation question.',
    why: 'Synthesis is the interesting hypothesis, and it is the one the audience is already asking about.',
    guard: 'Always run the reverse search first, and write the miscaptioning claim separately from the synthesis claim. Most deception is recycled truth.',
    frequency: 'high',
  },
  {
    id: 'edit-mistaken-for-synthesis',
    name: 'Edit read as generation',
    category: 'reasoning',
    what: 'Cropping, colour grading, object removal or a beauty filter is reported as AI generation.',
    why: 'Modern phone pipelines and one-tap edits leave traces that look like generative ones, and both are technically "AI" now.',
    guard: 'State which claim you are testing: generated from nothing, altered in a material way, or accurately captured but falsely described.',
    frequency: 'medium',
  },
  {
    id: 'metadata-is-editable',
    name: 'Metadata treated as testimony',
    category: 'technical',
    what: 'A generator name, a timestamp or an author field is quoted as though the file could not have been written to.',
    why: 'Metadata is structured, technical-looking, and trivially editable by anyone with a free tool.',
    guard: 'Treat a metadata field as a claim by whoever last wrote the file. Corroborate it against distribution history before it carries weight.',
    frequency: 'medium',
  },
  {
    id: 'false-independence',
    name: 'Counting one source twice',
    category: 'social',
    what: 'Several outlets or accounts are counted as corroboration when all of them trace to one upstream post.',
    why: 'Aggregation and syndication multiply an item quickly, and each copy looks like a separate publisher.',
    guard: 'Trace every source to its upstream before counting it. Mark independence explicitly; "unknown" is not "independent".',
    frequency: 'high',
  },
  {
    id: 'interested-party-treated-as-neutral',
    name: 'Interested party as referee',
    category: 'social',
    what: 'A denial or a confirmation from someone with a stake is weighted like a neutral record.',
    why: 'Official-sounding statements arrive formatted like evidence.',
    guard: 'Record the interest alongside the statement, on both the source and the reviewer.',
    frequency: 'medium',
  },
  {
    id: 'poster-signal-imported-into-media-claim',
    name: 'Judging the media by the poster',
    category: 'reasoning',
    what: 'A thin or hostile account is used as evidence that the media itself is synthetic.',
    why: 'The two questions feel like one, and account signals are easy to gather.',
    guard: 'Keep poster credibility in a provenance claim. A bad-faith account can still post a real photograph.',
    frequency: 'medium',
  },
  {
    id: 'noise-suppression-mistaken-for-synthesis',
    name: 'Clean audio read as cloned',
    category: 'technical',
    what: 'Missing breath and room tone are taken as signs of voice synthesis.',
    why: 'Call platforms and phones strip exactly the cues a reviewer listens for.',
    guard: 'Ask how the audio reached you before you judge how it sounds.',
    frequency: 'medium',
  },
  {
    id: 'timezone-and-clock-drift',
    name: 'Clock conflicts that are not conflicts',
    category: 'technical',
    what: 'A timestamp mismatch is reported without checking timezone, device clock, or export rewriting.',
    why: 'Timestamps look authoritative and rarely are.',
    guard: 'Resolve the timezone and the device before recording a timeline conflict.',
    frequency: 'medium',
  },
  {
    id: 'provenance-is-not-authenticity',
    name: 'Signature read as truth',
    category: 'technical',
    what: 'A valid Content Credentials manifest is treated as proof that the scene happened.',
    why: 'Signed provenance is genuinely valuable, and the badge implies more than it asserts.',
    guard: 'Read what the manifest asserts and who signed it. Generators sign their output too.',
    frequency: 'medium',
  },
  {
    id: 'single-reviewer-lock-in',
    name: 'One reviewer, one story',
    category: 'social',
    what: 'The first hypothesis shapes every later observation, and no one is positioned to contradict it.',
    why: 'This work is usually done alone and under time pressure.',
    guard: 'Name the falsifier for each claim before gathering evidence, and record a second reviewer when the stakes justify one.',
    frequency: 'high',
  },
];

/** @type {Map<string, FailureMode>} */
const BY_ID = new Map(FAILURE_MODES.map((f) => [f.id, f]));

/** @param {string} id */
export function getFailureMode(id) {
  return BY_ID.get(id);
}

/**
 * The failure modes a given set of indicator ids exposes the reviewer to.
 * @param {string[]} indicatorIds
 * @param {import('../schema/types.js').Indicator[]} catalog
 */
export function failureModesFor(indicatorIds, catalog) {
  const ids = new Set();
  for (const ind of catalog) {
    if (!indicatorIds.includes(ind.id)) continue;
    for (const fm of ind.failureModes ?? []) ids.add(fm);
  }
  return [...ids].map((id) => BY_ID.get(id)).filter(Boolean);
}
