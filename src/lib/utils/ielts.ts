import type { Skill, SkillTarget, Mock } from "@/types";

export const SKILLS: Skill[] = ["listening", "reading", "writing", "speaking"];

export const SKILL_LABEL: Record<Skill, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export const SKILL_COLOR: Record<Skill, string> = {
  listening: "#5b85ff",
  reading: "#22c55e",
  writing: "#f59e0b",
  speaking: "#ec4899",
};

export function roundBand(n: number): number {
  // IELTS bands are in 0.5 increments
  return Math.round(n * 2) / 2;
}

export function clampBand(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(9, n));
}

/** Average of last N mocks per skill, rounded to nearest band. */
export function currentBandFromMocks(mocks: Mock[], skill: Skill, lookback = 5): number {
  const filtered = mocks
    .filter((m) => m.skill === skill)
    .slice(-lookback)
    .map((m) => m.band);
  if (filtered.length === 0) return 0;
  const avg = filtered.reduce((s, n) => s + n, 0) / filtered.length;
  return roundBand(avg);
}

/** Overall band: average of 4 skill bands, rounded up to the nearest 0.5. */
export function overallBand(targets: SkillTarget[]): number {
  if (targets.length === 0) return 0;
  const valid = targets.filter((t) => t.current_band > 0);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((s, t) => s + t.current_band, 0) / valid.length;
  // IELTS overall rounding: nearest 0.5, rounded up if .25 or .75
  const x2 = avg * 2;
  return Math.round(x2) / 2;
}

export function improvementPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function bandColor(band: number): string {
  if (band >= 8) return "#22c55e";
  if (band >= 7) return "#5b85ff";
  if (band >= 6) return "#f59e0b";
  if (band >= 5) return "#ec4899";
  return "#94a3b8";
}
