export const STATS = [
  { key: "CHA", name: "Charisma", meaning: "Personality", colour: "var(--soft-pink)", icon: "chat" },
  { key: "CUL", name: "Culture", meaning: "Seeing the world and what it offers", colour: "var(--sky)", icon: "globe" },
  { key: "STR", name: "Strength", meaning: "Physique", colour: "var(--coral)", icon: "dumbbell" },
  { key: "SUC", name: "Success", meaning: "Personal goals", colour: "var(--gold)", icon: "trophy" },
  { key: "SKI", name: "Skill", meaning: "Education and learning", colour: "var(--cyan)", icon: "brain" },
  { key: "VIT", name: "Vitality", meaning: "Health", colour: "var(--green)", icon: "heart" },
  { key: "AUR", name: "Aura", meaning: "Looks and presence", colour: "var(--violet)", icon: "wand" },
  { key: "FIN", name: "Financial", meaning: "Financial goals", colour: "var(--lime)", icon: "coin" },
] as const;

export type StatKey = (typeof STATS)[number]["key"];
export type StatBlock = Record<StatKey, number>;

export const STAT_KEYS = STATS.map((s) => s.key) as StatKey[];

export const emptyStats = (): StatBlock =>
  STAT_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as StatBlock);

export function addStats(a: StatBlock, b: Partial<StatBlock>): StatBlock {
  const out = { ...a };
  for (const k of STAT_KEYS) out[k] = (out[k] || 0) + (b[k] || 0);
  return out;
}

export function statTotal(s: Partial<StatBlock>) {
  return STAT_KEYS.reduce((n, k) => n + (s[k] || 0), 0);
}

export const DIFFICULTY = {
  easy: { label: "Easy", points: 1, colour: "var(--green)" },
  medium: { label: "Medium", points: 2, colour: "var(--gold)" },
  hard: { label: "Hard", points: 3, colour: "var(--orange)" },
  veryhard: { label: "Very hard", points: 4, colour: "var(--coral)" },
} as const;

export type Difficulty = keyof typeof DIFFICULTY;

/** A finished long term goal pays 10 points into every stat the user picked. */
export const GOAL_POINTS_PER_STAT = 10;

/** Every stat point is worth this much experience. */
export const XP_PER_POINT = 12;

/** Experience needed to move from `level` to the next one. */
export function xpForNextLevel(level: number) {
  return 80 + (level - 1) * 40;
}

export function applyXp(level: number, xp: number, gained: number) {
  let l = level;
  let x = xp + gained;
  let levelsGained = 0;
  while (l < 100 && x >= xpForNextLevel(l)) {
    x -= xpForNextLevel(l);
    l += 1;
    levelsGained += 1;
  }
  if (l >= 100) x = Math.min(x, xpForNextLevel(100));
  return { level: l, xp: x, levelsGained };
}

/** Coins are the soft reward shown next to experience. */
export function coinsFor(points: number) {
  return points * 3;
}

export function difficultyFromPoints(points: number): Difficulty {
  if (points <= 2) return "easy";
  if (points <= 4) return "medium";
  if (points <= 6) return "hard";
  return "veryhard";
}
