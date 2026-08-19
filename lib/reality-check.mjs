const SIGNALS = [
  {
    key: "sourceKnown",
    weight: 15,
    missingAction: "Find the earliest available source.",
  },
  {
    key: "contextConsistent",
    weight: 10,
    missingAction: "Compare the media with the surrounding event and timeline.",
  },
  {
    key: "provenancePresent",
    weight: 15,
    missingAction: "Look for capture, edit, or content-credential provenance.",
  },
  {
    key: "independentlyCorroborated",
    weight: 15,
    missingAction: "Seek independent reporting or a second primary source.",
  },
  {
    key: "manipulationSignalsAbsent",
    weight: 45,
    missingAction: "Inspect for editing or generation artifacts.",
  },
];

/**
 * Evaluate evidence without uploading or retaining the media itself.
 * @param {Record<string, boolean>} evidence
 */
export function evaluateRealityCheck(evidence) {
  const score = SIGNALS.reduce(
    (total, signal) => total + (evidence[signal.key] === true ? signal.weight : 0),
    0,
  );

  const classification =
    evidence.manipulationSignalsAbsent !== true
      ? "high-risk"
      : score >= 80
        ? "strong-evidence"
        : score >= 45
          ? "needs-verification"
          : "high-risk";

  const missingActions = SIGNALS.filter(
    (signal) => evidence[signal.key] !== true,
  ).map((signal) => signal.missingAction);

  const nextActions =
    missingActions.length === 0
      ? [
          "Preserve the source and provenance record.",
          "Re-check if the media or surrounding claim changes.",
        ]
      : missingActions;

  return { score, classification, nextActions };
}

export const realityCheckSignals = SIGNALS.map(({ key, weight }) => ({
  key,
  weight,
}));
