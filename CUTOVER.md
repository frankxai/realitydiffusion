# Domain cutover and rollback — realitydiffusion.ai

## Current state (verified from the portfolio manifest, 2026-09-02)

- `realitydiffusion.ai` serves a **301 redirect to realityarchitect.ai**. That
  redirect is production DNS and it is correct today: there was nothing at the
  domain to send people to.
- A Vercel project named `realitydiffusion` exists and is linked to
  `frankxai/realitydiffusion`. The portfolio manifest flags it
  `vercel-project-unclaimed`; this branch claims it.
- Nothing in this repository changes DNS, aliases, environment variables, or the
  redirect. Removing the redirect is a Frank-only action and it is the last step
  below, not the first.

## Why the redirect stays until it does not

The manifest verdict for this surface is **redirect — keep until the Reality
Check preview verifies**. A live domain pointing at an unfinished tool is worse
than a redirect pointing at a real site. The bar for cutover is not "the page
deploys"; it is the checklist below.

## Preview verification checklist

Run against the Vercel **preview** deployment for branch
`agent/claude/reality-check-v1`. Every line is pass/fail; any fail stops the
cutover.

**Build and shape**

1. `npm run verify` passes locally and in the preview build (27 tests, no deps).
2. `npm run build` produces `site/` containing `index.html`, `styles.css`,
   `app.js` and `src/`.
3. The preview serves the page at `/` with no build step other than that copy.

**The privacy promise, verified rather than asserted**

4. Open the network tab, complete a full case, export both formats: the only
   requests are for same-origin static files. No fetch, no beacon, no third-party
   font, no analytics.
5. The response carries the `Content-Security-Policy` header from `vercel.json`,
   and it matches the meta tag byte for byte.
6. Disconnect the network and reload from cache: the workbench still runs, scores
   and exports.
7. localStorage holds the case; "Clear this case" removes it.

**The product actually works**

8. A case can be completed end to end on a phone-width viewport: title, claim,
   checklist, alternatives, reading, export.
9. The reading changes as answers change, and the ceiling explains itself in
   words a non-specialist can act on.
10. A Markdown export and a JSON export both download and both contain the
    lean, the ceiling, the residual doubt, the alternatives and the version.
11. Typing "this is definitely AI-generated" into the claim blocks the export
    and says why.

**Accessibility and craft**

12. Full keyboard completion: tab reaches every control, focus is always visible,
    the radio groups are operable with arrow keys, the skip link works.
13. Screen-reader pass on the checklist: each question is announced with its
    fieldset legend; the reading region announces updates.
14. Contrast passes AA in both light and dark rendering; touch targets are 44px.
15. `prefers-reduced-motion` respected (there is no motion to suppress, which is
    the point).

**Honesty**

16. No claim of reliable AI-detection appears anywhere on the surface.
17. The no-detection-claim boundary and the link to `BENCHMARK-PLAN.md` are
    visible without scrolling past the workbench.
18. No price, no checkout, no email capture. The waitlist line says only that the
    waitlist opens with the preview.

## Cutover sequence (Frank-only from step 3)

1. Merge `agent/claude/reality-check-v1` into `main` after review.
2. Confirm the production deployment of `main` in the `realitydiffusion` Vercel
   project is green and re-run the checklist against it.
3. **Explicit production approval.** Frank says the words. Nothing before this
   step touches DNS.
4. Attach `realitydiffusion.ai` (and `www`) to the `realitydiffusion` Vercel
   project.
5. Remove the 301 to `realityarchitect.ai` at the DNS/redirect layer.
6. Verify: `curl -I https://realitydiffusion.ai` returns 200 from the new project,
   not a 301. Verify `www` resolves. Verify the CSP header survived.
7. Update `starlight/graph/properties.graph.json` and the portfolio manifest:
   verdict moves from `redirect` to `live`, and the `vercel-project-unclaimed`
   flag clears.

## Rollback

Any of these triggers a rollback, at any point after step 4:

- The page errors, blanks, or fails to score on a mainstream browser.
- Any request leaves the origin.
- The CSP header is missing in production.
- A visitor could read the page as a detection claim.

**Rollback procedure**

1. In Vercel, promote the previous known-good production deployment, or remove
   the domain from the project.
2. Re-instate the 301 `realitydiffusion.ai → realityarchitect.ai` at the same
   layer it was removed from. This is the safe resting state and it costs
   nothing: it is where the domain has been all along.
3. Revert the manifest rows to `redirect`.
4. Write what failed into the decision memo before attempting cutover again.

Rollback is cheap here by construction: the surface is static files with no
database, no session, no payment, and no user account. There is no migration to
unwind, which is a reason to keep it that way for as long as possible.
