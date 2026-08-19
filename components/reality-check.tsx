"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  evaluateRealityCheck,
  type RealityCheckResult,
  type RealityEvidence,
} from "@/lib/reality-check.mjs";

const signalDefinitions: Array<{
  key: keyof RealityEvidence;
  label: string;
  note: string;
  code: string;
}> = [
  {
    key: "sourceKnown",
    code: "S01",
    label: "The earliest available source is known",
    note: "Not just the account or article that reposted it.",
  },
  {
    key: "contextConsistent",
    code: "S02",
    label: "The surrounding event and timeline are consistent",
    note: "Location, date, weather, language, and sequence agree.",
  },
  {
    key: "provenancePresent",
    code: "S03",
    label: "Capture or editing provenance is available",
    note: "Original file history, content credentials, or an accountable source.",
  },
  {
    key: "independentlyCorroborated",
    code: "S04",
    label: "A second primary source corroborates the claim",
    note: "Independent evidence, not another citation of the same upload.",
  },
  {
    key: "manipulationSignalsAbsent",
    code: "S05",
    label: "No unresolved manipulation signals remain",
    note: "Cuts, reflections, shadows, audio, metadata, and model artifacts were inspected.",
  },
];

const initialEvidence: RealityEvidence = {
  sourceKnown: false,
  contextConsistent: false,
  provenancePresent: false,
  independentlyCorroborated: false,
  manipulationSignalsAbsent: false,
};

const resultCopy = {
  "strong-evidence": {
    label: "Strong evidence",
    summary: "The claim has a credible evidence chain. Preserve it; do not treat the score as permanent certification.",
  },
  "needs-verification": {
    label: "Needs verification",
    summary: "Some signals support the claim, but the evidence chain is incomplete. Hold publication or attribution.",
  },
  "high-risk": {
    label: "High risk",
    summary: "The claim lacks critical support or contains unresolved manipulation signals. Do not amplify it as fact.",
  },
};

export function RealityCheck() {
  const [evidence, setEvidence] = useState<RealityEvidence>(initialEvidence);
  const [result, setResult] = useState<RealityCheckResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function updateSignal(key: keyof RealityEvidence, checked: boolean) {
    setEvidence((current) => ({ ...current, [key]: checked }));
    setResult(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(evaluateRealityCheck(evidence));
  }

  function reset() {
    setEvidence(initialEvidence);
    setResult(null);
  }

  return (
    <section className="check-shell" id="check" aria-labelledby="check-title">
      <div className="check-intro">
        <p className="index-label">Field protocol / 01</p>
        <h2 id="check-title">Run a Reality Check</h2>
        <p>
          Assess the evidence around a piece of media. This does not declare an image, video, or recording authentic; it makes the missing work visible.
        </p>
        <div className="privacy-note">
          <span aria-hidden="true">●</span>
          <strong>Nothing is uploaded or stored.</strong> Your selections stay in this browser tab and are not sent to a model.
        </div>
      </div>

      <form className="evidence-form" onSubmit={submit}>
        <fieldset>
          <legend className="sr-only">Evidence signals</legend>
          {signalDefinitions.map((signal) => (
            <label className="signal-row" key={signal.key}>
              <span className="signal-code" aria-hidden="true">{signal.code}</span>
              <span className="signal-copy">
                <strong>{signal.label}</strong>
                <small>{signal.note}</small>
              </span>
              <input
                checked={evidence[signal.key]}
                name={signal.key}
                onChange={(event) => updateSignal(signal.key, event.target.checked)}
                type="checkbox"
              />
            </label>
          ))}
        </fieldset>

        <div className="form-actions">
          <button className="button button-light" type="submit">Evaluate evidence</button>
          <button className="text-button" onClick={reset} type="button">Clear signals</button>
        </div>

        {result ? (
          <div
            className="result-block"
            data-classification={result.classification}
            ref={resultRef}
            tabIndex={-1}
          >
            <div className="result-heading">
              <p>{resultCopy[result.classification].label}</p>
              <output aria-live="polite">{result.score}<span>/100</span></output>
            </div>
            <p>{resultCopy[result.classification].summary}</p>
            <h3>Next inspection steps</h3>
            <ol>
              {result.nextActions.map((action) => <li key={action}>{action}</li>)}
            </ol>
          </div>
        ) : (
          <p className="result-pending" aria-live="polite">Select the signals you can support, then evaluate.</p>
        )}
      </form>
    </section>
  );
}
