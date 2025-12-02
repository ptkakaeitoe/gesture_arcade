const bands = [
  { threshold: 400, title: "PHASE MASTER", tone: "Dual-mode uplink perfectly synchronized." },
  { threshold: 250, title: "VECTOR PRIME", tone: "Signal latency minimal; reflex bus locked in." },
  { threshold: 150, title: "DRIFT RUNNER", tone: "Stability nominal though drift detected." },
  { threshold: 50, title: "STATIC FIELD", tone: "Packet loss rising; recalibration advised." },
  { threshold: 0, title: "LINK DOWN", tone: "Telemetry corrupted during sprint channel hopping." },
];

const pickBand = (score: number) =>
  bands.find((band) => score >= band.threshold) ?? bands[bands.length - 1];

export const getMissionDebrief = async (
  score: number,
  maxCombo: number
): Promise<string> => {
  const band = pickBand(score);
  const comboNote =
    maxCombo > 25
      ? "Combos saturated the uplink buffer."
      : maxCombo > 10
      ? "Combo cadence stable."
      : "Combo stream shallow.";
  return `${band.title}: ${band.tone} Logged distance ${score}m. ${comboNote}`;
};
