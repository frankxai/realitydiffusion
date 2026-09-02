/**
 * The indicator catalog: the questions a reviewer answers by hand.
 *
 * Every indicator here is answerable by looking, reading, and searching — not by
 * running a detector on the media. That is deliberate: Reality Check never
 * receives the media, and no shipped detector has a published error rate on the
 * open web that would justify weighting its output higher than a reviewer's own
 * corroboration work.
 *
 * Weights are capped at 3 so that no single indicator can carry a claim, and
 * every indicator ships the innocent explanations that produce the same
 * observation. Those alternatives are not decoration: the engine refuses to
 * score a claim that has not carried at least one forward.
 */

import { meta } from '../schema/types.js';

const CATALOG_META = meta('catalog:reality-diffusion', { provenance: 'catalog', visibility: 'public' });

/** @type {import('../schema/types.js').Indicator[]} */
export const INDICATORS = [
  {
    id: 'c2pa-manifest-present',
    family: 'provenance',
    appliesTo: ['image', 'video', 'audio', 'document'],
    question: 'Does the file carry a Content Credentials (C2PA) manifest?',
    direction: 'toward-authentic',
    weight: 2,
    evaluationRule: 'Mark observed only if a manifest was read from the original file, not from a platform badge or a screenshot of one.',
    alternatives: [
      'A manifest can be attached to synthetic media too; several generators sign their output, which makes the manifest a provenance record, not an authenticity verdict.',
      'A valid manifest on a re-edited file may describe only the last edit.',
    ],
    teaching: 'Content Credentials tell you what a signer asserts about a file\'s history. A present manifest raises the cost of a lie; it does not establish that a camera saw the scene. Read what the manifest actually claims and who signed it before you count it.',
    failureModes: ['provenance-is-not-authenticity'],
    meta: CATALOG_META,
  },
  {
    id: 'c2pa-manifest-broken',
    family: 'provenance',
    appliesTo: ['image', 'video', 'audio', 'document'],
    question: 'Is there a manifest that fails validation, or one whose asserted history contradicts the posted claim?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed when a validator reports a broken signature, or when the manifest names a generative tool the poster did not disclose.',
    alternatives: [
      'Platform re-encoding routinely breaks signatures on ordinary photographs.',
      'A generative tool in the chain may have been used for cropping or upscaling only.',
    ],
    teaching: 'A broken signature is much more often a platform pipeline than a forgery. Treat it as a prompt to find the original, not as a finding.',
    failureModes: ['platform-pipeline-mistaken-for-tampering'],
    meta: CATALOG_META,
  },
  {
    id: 'exif-absent',
    basis: 'absence',
    family: 'metadata',
    appliesTo: ['image', 'video'],
    question: 'Is capture metadata (camera make, model, lens, timestamps) entirely absent?',
    direction: 'toward-synthetic',
    weight: 1,
    evaluationRule: 'Observed only when metadata was inspected on a file obtained as close to the original as possible.',
    alternatives: [
      'Every major social platform strips metadata on upload, so absence is the normal case for anything reshared.',
      'Screenshots, messaging apps and privacy tools strip metadata by design.',
    ],
    teaching: 'Missing EXIF is the weakest signal in this catalog and the most over-read one. It is worth one point and only in company.',
    failureModes: ['absence-read-as-evidence', 'platform-pipeline-mistaken-for-tampering'],
    meta: CATALOG_META,
  },
  {
    id: 'metadata-generator-field',
    family: 'metadata',
    appliesTo: ['image', 'video', 'audio', 'document'],
    question: 'Does a software or generator field name an image model or synthesis tool?',
    direction: 'toward-synthetic',
    weight: 3,
    evaluationRule: 'Observed when the field is read from the file itself and names a generative system, or carries a generation prompt or seed.',
    alternatives: [
      'Metadata is trivially editable, so it can be planted to discredit a genuine file.',
      'A generative tool may have been used for a legitimate step such as upscaling or background removal.',
    ],
    teaching: 'This is the strongest single indicator in the catalog and it is still worth 3, because a text field anyone can write is not proof. Corroborate against the distribution history before you lean on it.',
    failureModes: ['metadata-is-editable'],
    meta: CATALOG_META,
  },
  {
    id: 'metadata-timeline-conflict',
    family: 'metadata',
    appliesTo: ['image', 'video', 'audio'],
    question: 'Do embedded timestamps contradict the posted account of when this was captured?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed when the conflict survives a timezone check and a device-clock check.',
    alternatives: [
      'Device clocks are frequently wrong, unset, or in the wrong timezone.',
      'Export and edit steps rewrite timestamps to the time of export.',
    ],
    teaching: 'Timeline conflicts are about the posted claim, not about the pixels. Write the claim down first, then test it.',
    failureModes: ['timezone-and-clock-drift'],
    meta: CATALOG_META,
  },
  {
    id: 'earlier-copy-exists',
    family: 'distribution',
    appliesTo: ['image', 'video', 'audio', 'text', 'document'],
    question: 'Does a reverse search find an earlier copy that predates the posted event?',
    direction: 'toward-synthetic',
    weight: 3,
    evaluationRule: 'Observed when an earlier instance is dated by an independent archive or publication, not by an on-page timestamp the poster controls.',
    alternatives: [
      'Archive dates can reflect crawl time rather than publication time.',
      'The earlier copy may be a different, genuinely similar scene.',
    ],
    teaching: 'Recontextualised real media is far more common than synthesis. An earlier copy usually means miscaptioning, which is a different claim from "this was generated" — write it as its own claim.',
    failureModes: ['synthesis-assumed-where-recontextualisation-explains'],
    meta: CATALOG_META,
  },
  {
    id: 'no-independent-corroboration',
    basis: 'absence',
    family: 'corroboration',
    appliesTo: ['image', 'video', 'audio', 'text', 'document'],
    question: 'For an event that would have many witnesses, does no independent record of it exist?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed only after searching at least two independent source families and only when the event claimed is one that would leave records.',
    alternatives: [
      'Genuine footage from closed, remote or low-coverage settings often stands alone.',
      'Recency: corroboration may simply not have been published yet.',
    ],
    teaching: 'Silence is weak evidence and it decays. Record when you searched, because "no corroboration on day one" is not the same finding as "none after a week".',
    failureModes: ['absence-read-as-evidence'],
    meta: CATALOG_META,
  },
  {
    id: 'independent-corroboration',
    family: 'corroboration',
    appliesTo: ['image', 'video', 'audio', 'text', 'document'],
    question: 'Does a source that does not share an origin with the poster report the same event?',
    direction: 'toward-authentic',
    weight: 3,
    evaluationRule: 'Observed only when the second source does not trace back to the same upstream post. Two outlets citing one tweet are one source.',
    alternatives: [
      'Coordinated accounts and syndication produce the appearance of independence.',
      'A second source may be reporting the claim, not confirming the media.',
    ],
    teaching: 'Independence is the hardest thing to check and the most valuable thing to have. Trace each source to its upstream before counting it.',
    failureModes: ['false-independence'],
    meta: CATALOG_META,
  },
  {
    id: 'account-history-thin',
    family: 'distribution',
    appliesTo: ['image', 'video', 'audio', 'text', 'document'],
    question: 'Was the account that first posted this created recently, or does its history not match the subject?',
    direction: 'toward-synthetic',
    weight: 1,
    evaluationRule: 'Observed when the account\'s visible history is short or unrelated relative to the claim it is making.',
    alternatives: [
      'New accounts post genuine material constantly, including first-hand witnesses.',
      'Displayed join dates and history can be incomplete or deliberately reset.',
    ],
    teaching: 'This is a signal about the poster, not the media. Keep it in a claim about provenance, never in a claim about synthesis.',
    failureModes: ['poster-signal-imported-into-media-claim'],
    meta: CATALOG_META,
  },
  {
    id: 'variant-family-present',
    family: 'distribution',
    appliesTo: ['image', 'video'],
    question: 'Do several near-identical variants of the same scene circulate with small differences?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed when variants differ in ways a re-crop or re-encode does not explain, such as changed object counts or altered text.',
    alternatives: [
      'Burst photography and multi-camera coverage produce genuine near-duplicates.',
      'Third parties re-edit genuine media for engagement.',
    ],
    teaching: 'A family of siblings is one of the more reliable open-web signals of generation, because sampling is cheap and people post their best few.',
    failureModes: [],
    meta: CATALOG_META,
  },
  {
    id: 'text-render-artifacts',
    family: 'content',
    appliesTo: ['image', 'video'],
    question: 'Is rendered text inside the image malformed in a way printing or signage would not be?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed at native resolution on the largest available copy. Compression mush does not count.',
    alternatives: [
      'Heavy compression and upscaling destroy small text in genuine images.',
      'Foreign scripts, stylised signage and genuine typos read as artifacts to an unfamiliar eye.',
    ],
    teaching: 'Text has improved fastest in current generators. Treat clean text as no evidence at all, and malformed text as suggestive only at high resolution.',
    failureModes: ['artifact-catalogue-decays', 'compression-mistaken-for-artifact'],
    meta: CATALOG_META,
  },
  {
    id: 'physical-implausibility',
    family: 'content',
    appliesTo: ['image', 'video'],
    question: 'Does the scene contain a physical impossibility — shadows from conflicting light sources, reflections that do not correspond, geometry that cannot close?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed when the inconsistency can be stated precisely enough that another reviewer can check it, and it survives a lens and perspective explanation.',
    alternatives: [
      'Wide lenses, panorama stitching and multiple real light sources produce genuine oddities.',
      'Ordinary photo editing (removing an object, brightening a face) leaves the same traces.',
    ],
    teaching: 'Say which specific object and which specific light. "Something feels off" is not an observation, and vibe-based judgement is the single largest source of false positives in this work.',
    failureModes: ['vibe-based-judgement', 'edit-mistaken-for-synthesis'],
    meta: CATALOG_META,
  },
  {
    id: 'anatomy-continuity-break',
    family: 'content',
    appliesTo: ['image', 'video'],
    question: 'Do hands, teeth, jewellery, patterns or background objects change or fail to persist across the frame or across frames?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed when the specific object and the specific inconsistency are named, and it is visible on the highest-resolution copy available.',
    alternatives: [
      'Motion blur, occlusion and interlacing produce the same appearance in genuine video.',
      'Beauty filters and phone computational photography alter anatomy in real footage.',
    ],
    teaching: 'The hand-counting era is over for current models. This indicator is still useful for cheap or older tooling, and it decays quickly — check the catalog\'s review date.',
    failureModes: ['artifact-catalogue-decays'],
    meta: CATALOG_META,
  },
  {
    id: 'audio-visual-desync',
    family: 'signal',
    appliesTo: ['video'],
    question: 'Do mouth movements, plosives or ambient sound fail to correspond to the picture?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed when desync persists across several utterances and is not constant offset that a player or stream would explain.',
    alternatives: [
      'Streaming, transcoding and dubbing produce constant-offset desync in genuine video.',
      'Overdubbed or re-voiced genuine footage is common and legal.',
    ],
    teaching: 'A constant offset is a pipeline artifact. A varying, phoneme-level mismatch is the interesting case.',
    failureModes: ['platform-pipeline-mistaken-for-tampering'],
    meta: CATALOG_META,
  },
  {
    id: 'voice-prosody-flat',
    basis: 'absence',
    family: 'signal',
    appliesTo: ['audio', 'video'],
    question: 'Is the speech missing breath, room tone, or natural disfluency, or does the room acoustic not match the visible space?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed after listening on headphones to the longest continuous take available, at least fifteen seconds.',
    alternatives: [
      'Noise suppression on calls and phones removes breath and room tone from genuine audio.',
      'Studio recording and professional voice work sound unnaturally clean by design.',
    ],
    teaching: 'Voice cloning is the cheapest high-quality synthesis available and the hardest to judge by ear. Weight corroboration over listening.',
    failureModes: ['noise-suppression-mistaken-for-synthesis'],
    meta: CATALOG_META,
  },
  {
    id: 'subject-or-official-denial',
    family: 'corroboration',
    appliesTo: ['image', 'video', 'audio', 'text', 'document'],
    question: 'Has the depicted subject, or an official record holder, stated the media is not genuine?',
    direction: 'toward-synthetic',
    weight: 2,
    evaluationRule: 'Observed when the denial comes from a verified channel of the subject or record holder, not a report of a denial.',
    alternatives: [
      'Subjects deny genuine media that embarrasses them — the "liar\'s dividend".',
      'The denial may address a different circulating version.',
    ],
    teaching: 'A denial is a claim by an interested party. Record it, weight it modestly, and never let it close the file on its own.',
    failureModes: ['interested-party-treated-as-neutral'],
    meta: CATALOG_META,
  },
  {
    id: 'official-record-match',
    family: 'corroboration',
    appliesTo: ['image', 'video', 'audio', 'document'],
    question: 'Does an independent record — a register, a filing, a schedule, a weather archive — match what the media shows?',
    direction: 'toward-authentic',
    weight: 3,
    evaluationRule: 'Observed when the record was consulted directly and matches a checkable detail in the media, such as weather, light angle, or a listed event time.',
    alternatives: [
      'A generator can be prompted from public records, so a match is not unique to genuine capture.',
      'The record may describe a similar event on a different day.',
    ],
    teaching: 'Checkable external detail is the strongest evidence available without the file. Prefer it over anything you can see in the pixels.',
    failureModes: [],
    meta: CATALOG_META,
  },
  {
    id: 'source-chain-direct',
    family: 'provenance',
    appliesTo: ['image', 'video', 'audio', 'text', 'document'],
    question: 'Did you obtain the file from the person who says they captured it, in its original form?',
    direction: 'toward-authentic',
    weight: 3,
    evaluationRule: 'Observed only for a file received directly from the claimed capturer, unaltered by a platform.',
    alternatives: [
      'The claimed capturer may not be the capturer.',
      'An original-looking file can be produced from a generated frame.',
    ],
    teaching: 'Chain of custody outranks every pixel-level judgement in this catalog. If you can get the original, get the original.',
    failureModes: [],
    meta: CATALOG_META,
  },
  {
    id: 'detector-flagged-synthetic',
    family: 'signal',
    appliesTo: ['image', 'video', 'audio', 'text'],
    question: 'Did an external detector report this as synthetic?',
    direction: 'toward-synthetic',
    weight: 1,
    evaluationRule: 'Record the tool and version as a ToolResult first. Mark observed only when a detector reported synthetic; the engine will refuse to let it carry a claim on its own.',
    alternatives: [
      'Published detector accuracy collapses on compressed, cropped, or out-of-distribution web media.',
      'Detectors show documented demographic and content skew; a flag can reflect the subject, not the origin.',
    ],
    teaching: 'A detector output is a third-party claim about a distribution you cannot see. It is deliberately worth one point here, and it is capped: this product will not sell a detector\'s confidence as its own. See BENCHMARK-PLAN.md for what would have to be measured before that changes.',
    failureModes: ['detector-treated-as-oracle', 'unbenchmarked-tool-borrowed-authority'],
    meta: CATALOG_META,
  },
  {
    id: 'detector-cleared',
    family: 'signal',
    appliesTo: ['image', 'video', 'audio', 'text'],
    question: 'Did an external detector report this as authentic?',
    direction: 'toward-authentic',
    weight: 1,
    evaluationRule: 'Record the tool as a ToolResult. Mark observed only for a stated authentic result, not for an inconclusive one.',
    alternatives: [
      'Detectors miss current-generation output routinely; a clear result is weak evidence of authenticity.',
      'An inconclusive result is frequently displayed as a pass.',
    ],
    teaching: 'A clean detector result is the least informative outcome in the whole workflow. It is here so that reviewers record it rather than treat it as an exoneration.',
    failureModes: ['detector-treated-as-oracle'],
    meta: CATALOG_META,
  },
];

/** @type {Map<string, import('../schema/types.js').Indicator>} */
const BY_ID = new Map(INDICATORS.map((i) => [i.id, i]));

/** @param {string} id */
export function getIndicator(id) {
  return BY_ID.get(id);
}

/** @param {import('../schema/types.js').EvidenceItem['kind']} kind */
export function indicatorsFor(kind) {
  return INDICATORS.filter((i) => i.appliesTo.includes(kind));
}

export const INDICATOR_FAMILIES = ['provenance', 'metadata', 'distribution', 'content', 'signal', 'corroboration'];

/**
 * Families whose evidence is about where the media came from rather than what it
 * looks like. A claim standing only on appearance is capped by the engine.
 */
export const EXTERNAL_FAMILIES = ['provenance', 'distribution', 'corroboration'];

/** The date this catalog's content indicators were last reviewed against current generator output. */
export const CATALOG_REVIEWED_AT = '2026-09-02';
