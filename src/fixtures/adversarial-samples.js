/**
 * Adversarial samples — described, never shipped.
 *
 * No media files live in this repository and none ever will: the product's
 * promise is that nothing is uploaded, and a repo full of deepfakes would be a
 * distribution problem, a rights problem, and a lie about the boundary.
 *
 * Each sample is a case that breaks naive tooling, written as the evidence a
 * reviewer would record. They are the engine's regression suite and the
 * workbench's teaching set: every one of them is a case where the honest answer
 * is weaker than the answer a detector would give.
 */

import { meta } from '../schema/types.js';

const FIXTURE_META = meta('catalog:reality-diffusion', { provenance: 'catalog', visibility: 'public' });

/**
 * @typedef {object} AdversarialSample
 * @property {string} id
 * @property {string} name
 * @property {string} scenario        What the reviewer is looking at.
 * @property {string} trap            The wrong conclusion the case invites.
 * @property {string} groundTruth     What is actually true, for teaching only.
 * @property {Array<{indicatorId: string, state: 'observed'|'absent'|'unknown', note?: string}>} observations
 * @property {string[]} alternatives
 * @property {{maxBand: import('../schema/types.js').Band, lean?: import('../schema/types.js').Confidence['lean']}} expects
 * @property {string} teaches         The failure mode this sample drills.
 */

/** @type {AdversarialSample[]} */
export const ADVERSARIAL_SAMPLES = [
  {
    id: 'stripped-but-genuine',
    name: 'The stripped genuine photograph',
    scenario: 'A protest photograph reshared from a messaging app. No metadata of any kind. The reviewer cannot find the original poster.',
    trap: 'Reading "no EXIF" plus "no corroboration yet" as two points toward synthesis, and publishing a synthesis claim on the strength of two absences.',
    groundTruth: 'Genuine. Two rounds of platform re-encoding stripped everything, and coverage appeared the following day.',
    observations: [
      { indicatorId: 'exif-absent', state: 'observed', note: 'No camera fields present on the copy obtained.' },
      { indicatorId: 'no-independent-corroboration', state: 'observed', note: 'Two source families searched within four hours of posting.' },
    ],
    alternatives: [
      'The platform stripped the metadata, as it does for every upload.',
      'Corroboration exists but has not been published yet, four hours after the event.',
    ],
    expects: { maxBand: 'weak', lean: 'toward-synthetic' },
    teaches: 'absence-read-as-evidence',
  },
  {
    id: 'recontextualised-archive',
    name: 'The real photograph from the wrong year',
    scenario: 'A dramatic disaster image circulating as today\'s event. A reverse search finds it in a 2019 archive.',
    trap: 'Investigating it as a generation question and reporting "AI-generated" when the actual deception is the caption.',
    groundTruth: 'Genuine photograph, genuinely published in 2019, falsely captioned today.',
    observations: [
      { indicatorId: 'earlier-copy-exists', state: 'observed', note: 'Archive copy dated 2019 by an independent publisher.' },
      { indicatorId: 'metadata-timeline-conflict', state: 'observed', note: 'Embedded date precedes the claimed event by six years.' },
      { indicatorId: 'independent-corroboration', state: 'observed', note: 'The 2019 event is well documented.' },
    ],
    alternatives: [
      'The archive date reflects crawl time rather than publication time.',
      'This is a different but visually similar scene from the same location.',
    ],
    expects: { maxBand: 'moderate' },
    teaches: 'synthesis-assumed-where-recontextualisation-explains',
  },
  {
    id: 'detector-flags-a-painting',
    name: 'The detector flags a genuine studio portrait',
    scenario: 'A professionally lit, retouched studio portrait. A consumer detection service reports 94% AI.',
    trap: 'Quoting the 94% as a measurement and treating a single tool output as the finding.',
    groundTruth: 'Genuine photograph. Heavy retouching and a smooth studio background sit outside the detector\'s training distribution.',
    observations: [
      { indicatorId: 'detector-flagged-synthetic', state: 'observed', note: 'Consumer service, no published error rate for retouched studio work.' },
    ],
    alternatives: [
      'The detector is out of distribution on retouched studio photography.',
      'Retouching is not generation, and the detector does not distinguish them.',
    ],
    expects: { maxBand: 'weak', lean: 'toward-synthetic' },
    teaches: 'detector-treated-as-oracle',
  },
  {
    id: 'signed-synthetic',
    name: 'The signed generation',
    scenario: 'An image carrying a valid Content Credentials manifest. The manifest is signed by a generative model provider.',
    trap: 'Seeing a valid signature and a green badge and concluding the image is authentic.',
    groundTruth: 'Synthetic, and honestly labelled. The provenance chain is intact and says so.',
    observations: [
      { indicatorId: 'c2pa-manifest-present', state: 'observed', note: 'Manifest validates; signer is a generative model provider.' },
      { indicatorId: 'metadata-generator-field', state: 'observed', note: 'Generator field names the model and carries a seed.' },
    ],
    alternatives: [
      'The metadata was planted on a genuine photograph to discredit it.',
      'The generative tool in the chain was used only for upscaling.',
    ],
    expects: { maxBand: 'moderate', lean: 'toward-synthetic' },
    teaches: 'provenance-is-not-authenticity',
  },
  {
    id: 'liars-dividend',
    name: 'The denial of genuine footage',
    scenario: 'Genuine council-chamber video. The person shown states publicly that it is a deepfake. A detector returns inconclusive.',
    trap: 'Weighting an interested party\'s denial as if it were a neutral record, and letting an inconclusive detector run count as support.',
    groundTruth: 'Genuine. The chamber\'s own published recording matches frame for frame.',
    observations: [
      { indicatorId: 'subject-or-official-denial', state: 'observed', note: 'Denial issued from the subject\'s verified channel.' },
      { indicatorId: 'official-record-match', state: 'observed', note: 'Official published recording matches the circulating clip.' },
      { indicatorId: 'source-chain-direct', state: 'observed', note: 'Clip obtained from the chamber\'s own archive.' },
    ],
    alternatives: [
      'The official recording could itself have been substituted.',
      'The denial addresses a different, altered version in circulation.',
    ],
    expects: { maxBand: 'moderate', lean: 'toward-authentic' },
    teaches: 'interested-party-treated-as-neutral',
  },
  {
    id: 'clean-generation',
    name: 'The generation with no visible tells',
    scenario: 'A current-model image with correct hands, correct text on signage, and plausible lighting. Nothing in the picture looks wrong.',
    trap: 'Concluding authenticity because the known artifact checklist comes back clean.',
    groundTruth: 'Synthetic. Content-level artifact rules from 2023 no longer apply.',
    observations: [
      { indicatorId: 'text-render-artifacts', state: 'absent', note: 'Signage text renders correctly at native resolution.' },
      { indicatorId: 'anatomy-continuity-break', state: 'absent', note: 'Hands and jewellery are consistent.' },
      { indicatorId: 'variant-family-present', state: 'observed', note: 'Four near-identical variants with different object counts circulate.' },
      { indicatorId: 'earlier-copy-exists', state: 'unknown', note: 'Reverse search returned nothing; scope was two engines only.' },
    ],
    alternatives: [
      'The variants are frames from a burst or from multi-camera coverage.',
      'Third parties re-edited one genuine image into several versions.',
    ],
    expects: { maxBand: 'weak' },
    teaches: 'artifact-catalogue-decays',
  },
  {
    id: 'syndication-echo',
    name: 'The corroboration that is one source',
    scenario: 'Six outlets carry the same clip within an hour. Each cites the previous one; all trace to a single anonymous account.',
    trap: 'Counting six outlets as six independent confirmations.',
    groundTruth: 'One source. Independence was never established.',
    observations: [
      { indicatorId: 'independent-corroboration', state: 'absent', note: 'All six trace to one upstream post; none is independent.' },
      { indicatorId: 'account-history-thin', state: 'observed', note: 'Origin account created eleven days earlier.' },
      { indicatorId: 'no-independent-corroboration', state: 'observed', note: 'No source outside the syndication chain found.' },
    ],
    alternatives: [
      'The origin account is a genuine first-hand witness with a new account.',
      'Independent coverage exists in a language or platform not searched.',
    ],
    expects: { maxBand: 'moderate', lean: 'toward-synthetic' },
    teaches: 'false-independence',
  },
  {
    id: 'call-audio-clean',
    name: 'The suspiciously clean voice note',
    scenario: 'A voice note with no breath, no room tone, and even level throughout. Received forwarded through two messaging apps.',
    trap: 'Treating the missing breath as synthesis when noise suppression removed it.',
    groundTruth: 'Genuine, recorded on a phone with aggressive noise suppression and forwarded twice.',
    observations: [
      { indicatorId: 'voice-prosody-flat', state: 'observed', note: 'No breath or room tone across twenty seconds.' },
      { indicatorId: 'exif-absent', state: 'observed', note: 'Messaging apps stripped everything.' },
    ],
    alternatives: [
      'Phone noise suppression removes breath and room tone from genuine recordings.',
      'The recording was made in a treated room.',
    ],
    expects: { maxBand: 'weak', lean: 'toward-synthetic' },
    teaches: 'noise-suppression-mistaken-for-synthesis',
  },
];

/**
 * Turns a sample into a scoreable RealityCheck.v1 report. Deterministic: the
 * caller supplies the clock so fixtures are reproducible.
 *
 * @param {AdversarialSample} sample
 * @param {{at?: string}} [opts]
 * @returns {import('../schema/types.js').RealityCheckReport}
 */
export function sampleToReport(sample, opts = {}) {
  const at = opts.at ?? '2026-09-02T00:00:00.000Z';
  const evidenceId = `${sample.id}-item`;
  const observations = sample.observations.map((o, i) => ({
    id: `${sample.id}-obs-${i + 1}`,
    indicatorId: o.indicatorId,
    evidenceId,
    state: o.state,
    note: o.note ?? '',
    recordedAt: at,
    meta: FIXTURE_META,
  }));

  return {
    schema: 'RealityCheck.v1',
    id: sample.id,
    title: sample.name,
    createdAt: at,
    updatedAt: at,
    capture: {
      id: `${sample.id}-capture`,
      surfacedOn: 'fixture',
      claimedOrigin: sample.scenario,
      claimedCapturedAt: null,
      chainOfCustody: 'unknown',
      recompression: 'unknown',
      meta: FIXTURE_META,
    },
    evidence: [{
      id: evidenceId,
      kind: sample.id === 'call-audio-clean' ? 'audio' : 'image',
      descriptor: sample.scenario,
      locator: null,
      firstSeenAt: null,
      meta: FIXTURE_META,
    }],
    sources: [],
    observations,
    toolResults: [],
    claims: [{
      id: `${sample.id}-claim`,
      statement: 'The material is synthetic or materially manipulated rather than what it is presented as.',
      evidenceIds: [evidenceId],
      observationIds: observations.map((o) => o.id),
      alternatives: sample.alternatives.map((statement, i) => ({
        id: `${sample.id}-alt-${i + 1}`,
        statement,
        status: 'open',
        meta: FIXTURE_META,
      })),
      falsifier: 'The original file, obtained from the person who says they captured it.',
      meta: FIXTURE_META,
    }],
    reviewers: [],
    decision: {
      id: `${sample.id}-decision`,
      disposition: 'seek-more-evidence',
      rationale: 'Fixture case held open so the engine has to reach its conclusion from the evidence alone.',
      nextEvidenceSought: ['The original file'],
      decidedBy: null,
      decidedAt: at,
      meta: FIXTURE_META,
    },
    versions: [{
      version: 1,
      at,
      summary: 'Fixture seeded from the adversarial sample set.',
      supersedes: null,
      meta: FIXTURE_META,
    }],
  };
}
