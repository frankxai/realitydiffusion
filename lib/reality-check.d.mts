export type RealityEvidence = {
  sourceKnown: boolean;
  contextConsistent: boolean;
  provenancePresent: boolean;
  independentlyCorroborated: boolean;
  manipulationSignalsAbsent: boolean;
};

export type RealityClassification =
  | "strong-evidence"
  | "needs-verification"
  | "high-risk";

export type RealityCheckResult = {
  score: number;
  classification: RealityClassification;
  nextActions: string[];
};

export function evaluateRealityCheck(
  evidence: RealityEvidence,
): RealityCheckResult;

export const realityCheckSignals: ReadonlyArray<{
  key: keyof RealityEvidence;
  weight: number;
}>;
