import presetData from "@/data/tasks.json";
import { CATEGORY_ICONS, IconName } from "@/data/sprites";
import { Difficulty, StatBlock, StatKey, difficultyFromPoints, emptyStats, statTotal } from "./stats";

export type Repeat = "once" | "daily" | "weekly" | "monthly" | "yearly";

export type RawPreset = {
  task: string;
  category: string;
  levelUnlocked: number;
  repeated: boolean;
  repeatedTime: { daily: boolean; weekly: boolean; monthly: boolean; yearly?: boolean };
  stats: Record<string, number>;
};

export type Task = {
  key: string;
  title: string;
  category: string;
  icon: IconName;
  levelUnlocked: number;
  repeat: Repeat;
  difficulty: Difficulty;
  stats: StatBlock;
  points: number;
  custom: boolean;
};

function repeatOf(p: RawPreset): Repeat {
  if (!p.repeated) return "once";
  if (p.repeatedTime.daily) return "daily";
  if (p.repeatedTime.weekly) return "weekly";
  if (p.repeatedTime.monthly) return "monthly";
  if (p.repeatedTime.yearly) return "yearly";
  return "once";
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export const PRESET_TASKS: Task[] = (presetData as RawPreset[]).map((p, i) => {
  const stats = { ...emptyStats() } as StatBlock;
  for (const [k, v] of Object.entries(p.stats)) stats[k as StatKey] = v;
  const points = statTotal(stats);
  return {
    key: `p_${i}_${slug(p.task)}`,
    title: p.task,
    category: p.category,
    icon: CATEGORY_ICONS[p.category] ?? "checklist",
    levelUnlocked: p.levelUnlocked,
    repeat: repeatOf(p),
    difficulty: difficultyFromPoints(points),
    stats,
    points,
    custom: false,
  };
});

export const PRESET_CATEGORIES = Array.from(new Set(PRESET_TASKS.map((t) => t.category))).sort();

/** Start of the current period for a repeat rule, in the browser-agnostic ISO day format. */
export function periodStart(repeat: Repeat, now = new Date()): Date | null {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  switch (repeat) {
    case "once":
      return null;
    case "daily":
      return d;
    case "weekly": {
      const day = (d.getDay() + 6) % 7; // Monday first
      d.setDate(d.getDate() - day);
      return d;
    }
    case "monthly":
      d.setDate(1);
      return d;
    case "yearly":
      d.setMonth(0, 1);
      return d;
  }
}

export function isAvailable(repeat: Repeat, lastCompletedAt?: string | Date | null) {
  if (!lastCompletedAt) return true;
  const last = new Date(lastCompletedAt);
  if (repeat === "once") return false;
  const start = periodStart(repeat);
  return start ? last < start : true;
}

export function nextResetLabel(repeat: Repeat) {
  switch (repeat) {
    case "daily":
      return "Comes back tomorrow";
    case "weekly":
      return "Comes back next week";
    case "monthly":
      return "Comes back next month";
    case "yearly":
      return "Comes back next year";
    default:
      return "Finished for good";
  }
}

export const REPEAT_LABEL: Record<Repeat, string> = {
  once: "One off",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};
