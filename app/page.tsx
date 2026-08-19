import { RealityCheck } from "@/components/reality-check";

const method = [
  {
    number: "01",
    title: "Trace the source",
    text: "Find the earliest available file, upload, or accountable witness. Reposts inherit reach—not credibility.",
  },
  {
    number: "02",
    title: "Test the context",
    text: "Compare the claim with time, place, sequence, language, weather, lighting, and independent records.",
  },
  {
    number: "03",
    title: "Preserve provenance",
    text: "Record what you inspected, what changed, what remains uncertain, and where the evidence came from.",
  },
];

const boundaries = [
  ["Authenticity verdict", "No", "A score cannot certify that media is authentic."],
  ["Media upload", "No", "The first release evaluates your evidence notes, not the file."],
  ["Model invocation", "No", "No paid or remote AI model is called by the check."],
  ["Account or tracking", "No", "No account, saved history, or behavioral profile is created."],
];

export default function Home() {
  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Reality Diffusion home">
          <span aria-hidden="true">RD</span>
          Reality Diffusion
        </a>
        <nav aria-label="Primary navigation">
          <a href="#method">Method</a>
          <a href="#check">Reality Check</a>
          <a href="#boundaries">Boundaries</a>
        </nav>
        <p className="local-status"><span aria-hidden="true">●</span> Local-only tool</p>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="index-label">Synthetic media intelligence / 2026</p>
            <h1 id="hero-title">Reality is no longer a given. <em>It is an evidence practice.</em></h1>
            <p className="hero-lede">
              Reality Diffusion helps you slow down a synthetic-media claim, inspect its evidence chain, and decide what deserves belief, publication, or another question.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#check">Run the Reality Check</a>
              <a className="text-link" href="#method">Read the three-step method <span aria-hidden="true">↓</span></a>
            </div>
          </div>

          <aside className="evidence-field" aria-label="Evidence chain illustration">
            <div className="field-map" aria-hidden="true">
              <span className="ring ring-one" />
              <span className="ring ring-two" />
              <span className="ring ring-three" />
              <span className="field-axis field-axis-x" />
              <span className="field-axis field-axis-y" />
              <span className="field-origin">?</span>
            </div>
            <dl className="signal-ledger">
              <div><dt>Signal</dt><dd>What is visible</dd></div>
              <div><dt>Source</dt><dd>Where it began</dd></div>
              <div><dt>Context</dt><dd>What must agree</dd></div>
              <div><dt>Provenance</dt><dd>What can be preserved</dd></div>
            </dl>
            <p>A claim diffuses faster than its evidence. Reverse the direction.</p>
          </aside>
        </section>

        <section className="method-section" id="method" aria-labelledby="method-title">
          <div className="section-heading">
            <p className="index-label">Method / three passes</p>
            <h2 id="method-title">From impression to evidence</h2>
            <p>The method is intentionally model-agnostic. Detection tools change; accountable inspection remains.</p>
          </div>
          <ol className="method-list">
            {method.map((item) => (
              <li key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <RealityCheck />

        <section className="boundary-section" id="boundaries" aria-labelledby="boundary-title">
          <div className="boundary-copy">
            <p className="index-label">Trust boundary / public contract</p>
            <h2 id="boundary-title">A useful instrument, not an oracle</h2>
            <p>
              Synthetic-media verification is probabilistic. The product makes evidence gaps legible; it does not replace forensic expertise, primary reporting, or human accountability.
            </p>
          </div>
          <div className="boundary-table" role="table" aria-label="Current product boundaries">
            {boundaries.map(([capability, answer, explanation]) => (
              <div className="boundary-row" role="row" key={capability}>
                <strong role="cell">{capability}</strong>
                <span role="cell">{answer}</span>
                <p role="cell">{explanation}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="closing-statement" aria-labelledby="closing-title">
          <p className="index-label">Practice / before amplification</p>
          <h2 id="closing-title">Pause is not passivity. It is where verification begins.</h2>
          <a className="button button-light" href="#check">Inspect a claim</a>
        </section>
      </main>

      <footer>
        <div>
          <strong>Reality Diffusion</strong>
          <p>Understanding, creating, and verifying synthetic media.</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com/frankxai/realitydiffusion">Source</a>
          <a href="/llms.txt">LLM context</a>
          <a href="https://www.realityarchitect.ai">Reality Architect</a>
        </div>
        <p className="footer-note">A FrankX project · No media upload in this release.</p>
      </footer>
    </>
  );
}
