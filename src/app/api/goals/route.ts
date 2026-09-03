import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId, UserDoc } from "@/lib/auth";
import {
  GOAL_POINTS_PER_STAT,
  STAT_KEYS,
  StatBlock,
  StatKey,
  XP_PER_POINT,
  addStats,
  applyXp,
  coinsFor,
  emptyStats,
  statTotal,
} from "@/lib/stats";
import { ICONS, IconName } from "@/data/sprites";
import { GoalDoc } from "@/lib/queries";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const detail = String(body.detail ?? "").trim();
  const icon = (body.icon in ICONS ? body.icon : "mountain") as IconName;
  const statKeys: StatKey[] = (Array.isArray(body.statKeys) ? body.statKeys : []).filter(
    (k: string): k is StatKey => (STAT_KEYS as string[]).includes(k)
  );

  if (title.length < 2) return NextResponse.json({ error: "Give the goal a name." }, { status: 400 });
  if (statKeys.length === 0) return NextResponse.json({ error: "Pick at least one stat." }, { status: 400 });

  const db = await getDb();
  await db.collection("goals").insertOne({
    userId,
    title,
    detail,
    icon,
    statKeys,
    completed: false,
    completedAt: null,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}

/** Completing a goal pays 10 points into every stat it was tagged with. */
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await req.json();
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Unknown goal." }, { status: 400 });

  const db = await getDb();
  const goal = await db.collection<GoalDoc>("goals").findOne({ _id: new ObjectId(id), userId });
  if (!goal) return NextResponse.json({ error: "Unknown goal." }, { status: 404 });
  if (goal.completed) return NextResponse.json({ error: "Already claimed." }, { status: 409 });

  const stats: StatBlock = emptyStats();
  for (const k of goal.statKeys as StatKey[]) stats[k] = GOAL_POINTS_PER_STAT;

  const users = db.collection<UserDoc>("users");
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const points = statTotal(stats);
  const xp = points * XP_PER_POINT;
  const coins = coinsFor(points);
  const { level, xp: newXp, levelsGained } = applyXp(user.level, user.xp, xp);

  await Promise.all([
    db.collection("goals").updateOne(
      { _id: goal._id },
      { $set: { completed: true, completedAt: new Date() } }
    ),
    users.updateOne(
      { _id: user._id },
      { $set: { stats: addStats(user.stats, stats), level, xp: newXp }, $inc: { coins } }
    ),
    db.collection("completions").insertOne({
      userId,
      taskKey: `g_${goal._id.toString()}`,
      title: goal.title,
      category: "Long term goal",
      repeat: "once",
      stats,
      points,
      xp,
      coins,
      completedAt: new Date(),
    }),
  ]);

  return NextResponse.json({ title: goal.title, stats, xp, coins, level, levelsGained, streak: user.streak });
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Unknown goal." }, { status: 400 });

  const db = await getDb();
  await db.collection("goals").deleteOne({ _id: new ObjectId(id), userId });
  return NextResponse.json({ ok: true });
}
