const scoreBands = [
  { threshold: 350, header: "OMEGA RANK", tone: "NEAR-PERFECT STABILITY" },
  { threshold: 220, header: "ALPHA RANK", tone: "ELITE COMBO EXECUTION" },
  { threshold: 120, header: "BETA RANK", tone: "STABLE SIGNAL" },
  { threshold: 60, header: "DELTA RANK", tone: "IMPROVEMENT ADVISED" },
  { threshold: 0, header: "OMEGA FAILSAFE", tone: "SYSTEM DESYNC" },
];

const chooseBand = (score: number) =>
  scoreBands.find((band) => score >= band.threshold) ?? scoreBands[scoreBands.length - 1];

export const getMissionDebrief = async (
  score: number,
  maxCombo: number
): Promise<string> => {
  const band = chooseBand(score);
  const comboNote =
    maxCombo > 25
      ? "Combo buffer overloaded - style logged."
      : maxCombo > 10
      ? "Combo regulator steady - keep slicing."
      : "Combo sync weak - recalibration recommended.";

  return `${band.header}: ${band.tone}. Logged score ${score} with combo ceiling ${maxCombo}. ${comboNote}`;
};
