import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { DIFFICULTY, Difficulty, STAT_KEYS, StatBlock, StatKey, emptyStats } from "@/lib/stats";
import { ICONS, IconName } from "@/data/sprites";
import { Repeat } from "@/lib/tasks";

const REPEATS: Repeat[] = ["once", "daily", "weekly", "monthly", "yearly"];

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "").trim() || "Custom";
  const difficulty = body.difficulty as Difficulty;
  const repeat = body.repeat as Repeat;
  const icon = (body.icon in ICONS ? body.icon : "checklist") as IconName;
  const picked: string[] = Array.isArray(body.statKeys) ? body.statKeys : [];

  if (title.length < 2) return NextResponse.json({ error: "Give the task a name." }, { status: 400 });
  if (!(difficulty in DIFFICULTY)) return NextResponse.json({ error: "Pick a difficulty." }, { status: 400 });
  if (!REPEATS.includes(repeat)) return NextResponse.json({ error: "Pick how often it repeats." }, { status: 400 });

  const chosen = picked.filter((k): k is StatKey => (STAT_KEYS as string[]).includes(k));
  if (chosen.length === 0) return NextResponse.json({ error: "Pick at least one stat to raise." }, { status: 400 });

  // Difficulty sets the size of the reward: every chosen stat gets the same points.
  const stats: StatBlock = emptyStats();
  for (const k of chosen) stats[k] = DIFFICULTY[difficulty].points;

  const db = await getDb();
  const result = await db.collection("tasks").insertOne({
    userId,
    title,
    category,
    icon,
    difficulty,
    repeat,
    stats,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, key: `c_${result.insertedId.toString()}` });
}

/** Edit one of the player's own tasks. Built-in tasks are read only. */
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json();
  const key = String(body.key ?? "");
  const id = key.startsWith("c_") ? key.slice(2) : "";
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Built-in tasks cannot be edited. Hide it instead." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const category = String(body.category ?? "").trim() || "Custom";
  const difficulty = body.difficulty as Difficulty;
  const repeat = body.repeat as Repeat;
  const icon = (body.icon in ICONS ? body.icon : "checklist") as IconName;
  const picked: string[] = Array.isArray(body.statKeys) ? body.statKeys : [];

  if (title.length < 2) return NextResponse.json({ error: "Give the task a name." }, { status: 400 });
  if (!(difficulty in DIFFICULTY)) return NextResponse.json({ error: "Pick a difficulty." }, { status: 400 });
  if (!REPEATS.includes(repeat)) return NextResponse.json({ error: "Pick how often it repeats." }, { status: 400 });

  const chosen = picked.filter((k): k is StatKey => (STAT_KEYS as string[]).includes(k));
  if (chosen.length === 0) return NextResponse.json({ error: "Pick at least one stat to raise." }, { status: 400 });

  const stats: StatBlock = emptyStats();
  for (const k of chosen) stats[k] = DIFFICULTY[difficulty].points;

  const db = await getDb();
  const result = await db
    .collection("tasks")
    .updateOne(
      { _id: new ObjectId(id), userId },
      { $set: { title, category, icon, difficulty, repeat, stats, updatedAt: new Date() } }
    );

  if (result.matchedCount === 0) return NextResponse.json({ error: "Unknown task." }, { status: 404 });

  // Past completions keep the stats they paid at the time; only future ones change.
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const key = new URL(req.url).searchParams.get("key") ?? "";
  const id = key.startsWith("c_") ? key.slice(2) : "";
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Unknown task." }, { status: 400 });

  const db = await getDb();
  await db.collection("tasks").deleteOne({ _id: new ObjectId(id), userId });
  return NextResponse.json({ ok: true });
}
