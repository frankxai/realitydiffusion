# Benchmark plan — what would have to be true before Reality Diffusion made a detection claim

Reality Diffusion currently makes **no claim** that it can detect AI-generated or
manipulated media, and the shipped product runs no model on any media. This
document exists so that the absence of a claim is a position rather than an
oversight, and so that a future claim has a standard to clear rather than a
launch date to meet.

Nothing in this file describes work that has been done. Everything here is
`[OPEN]` until a receipt says otherwise.

## The claim we are not making

> "Reality Check tells you whether media is AI-generated."

We would need all six of the following before that sentence could appear on any
surface. Failing any one of them means the sentence stays off.

### 1. A test set that resembles the open web, not a research benchmark

Published detector accuracy is generally measured on uncompressed, uncropped,
single-generator corpora. The media a reviewer actually meets has been
re-encoded twice, cropped, screenshotted, and re-uploaded.

Required: a held-out set of at least 2,000 items per modality where every item
has passed through a realistic distribution pipeline (platform re-encode,
resize, screenshot-of-screen), with the pipeline recorded per item.

### 2. Ground truth with provenance, not with confidence

Every item needs a documented origin: a signed capture, a generation receipt, or
a first-party statement from the creator. "We are confident this one is real"
is not ground truth and cannot enter the set.

### 3. Error rates reported per subgroup, not in aggregate

A single accuracy number hides the failures that matter. Required reporting:
false-positive and false-negative rate broken down by modality, by generator
family, by compression level, and by depicted-subject demographics — the last
because documented detector skew means a flag can encode the subject rather than
the origin. A method that cannot report subgroup rates is not shippable here.

### 4. A time-decay measurement

Content-level indicators expire. Required: the same evaluation re-run against
generator output from at least two later model generations, with the decay curve
published. A claim made once is not a claim that stays true, so any published
number carries the date and the generator set it was measured on.

### 5. Calibration, not just discrimination

If the product ever reports a number, that number has to mean something: of the
cases scored "70% likely synthetic", roughly 70% must be synthetic. Required:
a reliability diagram and an expected-calibration-error figure, per modality.
Ranking ability (AUC) alone is not sufficient — it is what vendors report and it
is not what a reviewer needs.

### 6. An adversarial pass

Required: a documented attempt to defeat the method by someone who wants it to
fail — laundering through re-encoding, adversarial perturbation, hybrid
real-and-generated composites, and the recontextualisation cases where the media
is genuine and the caption is the lie.

## What is measurable today, and what we do measure

The evidence engine in `src/engine/` makes no detection claim, so it is
evaluated on a different question: does it refuse to overreach?

| Property | How it is checked | Status |
| --- | --- | --- |
| No band above `substantial` is reachable | `test/engine.test.js` scores every synthetic-leaning indicator at once | enforced |
| A claim with no alternative explanation cannot be scored | engine throws | enforced |
| One evidence family alone cannot exceed `weak` | breadth cap | enforced |
| Absence-only evidence cannot exceed `weak` | basis cap | enforced |
| Appearance-only evidence cannot exceed `moderate` | external-family cap | enforced |
| A detector result alone cannot exceed `weak` | signal cap | enforced |
| An export cannot carry certainty language | `flagCertainty` blocks it | enforced |
| Scoring is deterministic | same input, identical output | enforced |
| Two reviewers reach the same observations from the same material | inter-rater agreement study | `[OPEN]` — not run |
| The workbench improves reviewer accuracy over unaided judgement | controlled study against the adversarial sample set | `[OPEN]` — not run |

The two open rows are the honest gap: the engine's caps are defensible by
construction, but the claim that using this protocol makes a reviewer *better*
is unmeasured. Until the inter-rater study exists, the product is sold — when it
is sold at all — as a discipline and a record, not as an accuracy improvement.

## Adversarial samples

`src/fixtures/adversarial-samples.js` holds eight cases where the honest answer
is weaker than the answer a detector would give: a stripped genuine photograph,
a real image with a false caption, a studio portrait a detector flags, a signed
generation, a subject denying genuine footage, a clean current-generation image,
six outlets echoing one source, and a noise-suppressed voice note.

They are **described, not shipped**. No media file is in this repository and none
will be: the product's promise is that media is never uploaded, and hosting a
deepfake corpus would contradict the boundary, the rights position, and the
reason anyone would trust the page. A future benchmark set lives behind a
research agreement, not in a public git repository.
