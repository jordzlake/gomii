import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { PRESET_TASKS, Repeat, Task, isAvailable } from "./tasks";
import { Difficulty, StatBlock, emptyStats, statTotal } from "./stats";
import { IconName } from "@/data/sprites";

export type CustomTaskDoc = {
  _id: ObjectId;
  userId: string;
  title: string;
  category: string;
  icon: IconName;
  difficulty: Difficulty;
  repeat: Repeat;
  stats: StatBlock;
  createdAt: Date;
};

export type GoalDoc = {
  _id: ObjectId;
  userId: string;
  title: string;
  detail: string;
  statKeys: string[];
  icon: IconName;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
};

export type CompletionDoc = {
  _id: ObjectId;
  userId: string;
  taskKey: string;
  title: string;
  category: string;
  repeat: Repeat;
  stats: StatBlock;
  points: number;
  xp: number;
  coins: number;
  completedAt: Date;
};

export async function customTasks(userId: string): Promise<Task[]> {
  const db = await getDb();
  const docs = await db
    .collection<CustomTaskDoc>("tasks")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => ({
    key: `c_${d._id.toString()}`,
    title: d.title,
    category: d.category,
    icon: d.icon,
    levelUnlocked: 1,
    repeat: d.repeat,
    difficulty: d.difficulty,
    stats: { ...emptyStats(), ...d.stats },
    points: statTotal(d.stats),
    custom: true,
  }));
}

export async function lastCompletions(userId: string): Promise<Record<string, Date>> {
  const db = await getDb();
  const rows = await db
    .collection<CompletionDoc>("completions")
    .aggregate<{ _id: string; last: Date }>([
      { $match: { userId } },
      { $group: { _id: "$taskKey", last: { $max: "$completedAt" } } },
    ])
    .toArray();
  return Object.fromEntries(rows.map((r) => [r._id, r.last]));
}

export type TaskView = Task & {
  available: boolean;
  unlocked: boolean;
  hidden: boolean;
  lastDone: Date | null;
};

export function decorate(
  tasks: Task[],
  level: number,
  last: Record<string, Date>,
  hidden: Set<string> = new Set()
): TaskView[] {
  return tasks.map((t) => {
    const lastDone = last[t.key] ?? null;
    return {
      ...t,
      lastDone,
      hidden: hidden.has(t.key),
      unlocked: t.levelUnlocked <= level,
      available: t.levelUnlocked <= level && isAvailable(t.repeat, lastDone),
    };
  });
}

export async function allTasksFor(userId: string, level: number, hiddenKeys: string[] = []) {
  const [custom, last] = await Promise.all([customTasks(userId), lastCompletions(userId)]);
  const hidden = new Set(hiddenKeys);
  return {
    preset: decorate(PRESET_TASKS, level, last, hidden),
    custom: decorate(custom, level, last, hidden),
  };
}

export async function findTask(userId: string, key: string): Promise<Task | null> {
  if (key.startsWith("c_")) {
    const id = key.slice(2);
    if (!ObjectId.isValid(id)) return null;
    const db = await getDb();
    const d = await db.collection<CustomTaskDoc>("tasks").findOne({ _id: new ObjectId(id), userId });
    if (!d) return null;
    return {
      key,
      title: d.title,
      category: d.category,
      icon: d.icon,
      levelUnlocked: 1,
      repeat: d.repeat,
      difficulty: d.difficulty,
      stats: { ...emptyStats(), ...d.stats },
      points: statTotal(d.stats),
      custom: true,
    };
  }
  return PRESET_TASKS.find((t) => t.key === key) ?? null;
}

export async function goalsFor(userId: string) {
  const db = await getDb();
  return db.collection<GoalDoc>("goals").find({ userId }).sort({ completed: 1, createdAt: -1 }).toArray();
}

export async function recentCompletions(userId: string, limit = 12) {
  const db = await getDb();
  return db
    .collection<CompletionDoc>("completions")
    .find({ userId })
    .sort({ completedAt: -1 })
    .limit(limit)
    .toArray();
}

export async function userCategories(userId: string) {
  const db = await getDb();
  return db
    .collection<{ _id: ObjectId; userId: string; name: string; icon: IconName }>("categories")
    .find({ userId })
    .sort({ name: 1 })
    .toArray();
}
