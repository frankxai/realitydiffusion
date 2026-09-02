# Reality Diffusion

Reality Diffusion is a standalone public project for understanding, creating, and verifying synthetic media.

## Product boundary

Reality Diffusion is distinct from:

- **Reality Architect** — systems thinking and personal operating methods.
- **Arcanea** — creative intelligence and worldbuilding.
- **FrankX** — Frank's professional studio, research, and creator funnel.

The first release will focus on a private-in-the-browser **Reality Check**: a practical evidence protocol for assessing synthetic or manipulated media without uploading the material.

## Status

The first Reality Check slice is implemented on `agent/claude/reality-check-v1`: the
`RealityCheck.v1` schema, a deterministic evidence engine, a versioned report
exporter, a failure-mode catalogue, an adversarial sample set, and a static
in-browser workbench. The live domain keeps its compatibility redirect until the
preview clears `CUTOVER.md` and Frank approves production.

## What it does, and what it refuses to do

Reality Check structures a reviewer's own evidence and caps what may be concluded
from it. It runs no model on any media, receives no media, and makes **no
AI-detection claim**. `BENCHMARK-PLAN.md` states the evidence that would have to
exist before one could be made. Every claim leaves the engine as a banded lean
with an explicit ceiling, at least one alternative explanation, and the finding
that would overturn it. There is no "AI-generated: yes".

## Development contract

- First release: zero dependencies. Plain ESM in `src/`, `node --test` for tests,
  and a static page in `public/` that imports the same modules directly. A
  framework arrives when a server boundary does, and the first release has none.
- Commands: `npm run verify` (tests), `npm run build` (copies `public/` and `src/`
  into `site/`, which is what Vercel serves).
- Hosting: Vercel, static output, CSP set in `vercel.json` and in the page.
- Public object storage: Vercel Blob when required; no object store is needed for the static first release.
- Privacy: no user media upload or model invocation in the initial release.
- Release: tests, lint, typecheck, production build, responsive/browser QA, preview, then domain cutover.

## License

Source code first published from 2026-08-27 is available under FSL-1.1-ALv2. Earlier MIT releases remain MIT. Editorial content and brand assets remain copyright Frank Riemer unless explicitly stated otherwise.
