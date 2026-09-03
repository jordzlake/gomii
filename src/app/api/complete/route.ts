import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId, UserDoc } from "@/lib/auth";
import { findTask } from "@/lib/queries";
import { isAvailable } from "@/lib/tasks";
import { XP_PER_POINT, addStats, applyXp, coinsFor, statTotal } from "@/lib/stats";

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { key } = await req.json();
  if (typeof key !== "string") return NextResponse.json({ error: "Missing task." }, { status: 400 });

  const db = await getDb();
  const users = db.collection<UserDoc>("users");
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const task = await findTask(userId, key);
  if (!task) return NextResponse.json({ error: "That task no longer exists." }, { status: 404 });
  if (task.levelUnlocked > user.level) {
    return NextResponse.json({ error: "This task is still locked." }, { status: 403 });
  }

  const last = await db
    .collection("completions")
    .find({ userId, taskKey: key })
    .sort({ completedAt: -1 })
    .limit(1)
    .toArray();

  if (!isAvailable(task.repeat, last[0]?.completedAt ?? null)) {
    return NextResponse.json({ error: "Already done for this period." }, { status: 409 });
  }

  const points = statTotal(task.stats);
  const xp = points * XP_PER_POINT;
  const coins = coinsFor(points);
  const { level, xp: newXp, levelsGained } = applyXp(user.level, user.xp, xp);

  const today = dayKey();
  let streak = user.streak;
  if (user.lastCompletedOn !== today) {
    streak = user.lastCompletedOn === yesterdayKey() ? user.streak + 1 : 1;
  }

  await Promise.all([
    db.collection("completions").insertOne({
      userId,
      taskKey: key,
      title: task.title,
      category: task.category,
      stats: task.stats,
      points,
      xp,
      coins,
      completedAt: new Date(),
    }),
    users.updateOne(
      { _id: user._id },
      {
        $set: {
          stats: addStats(user.stats, task.stats),
          level,
          xp: newXp,
          streak,
          lastCompletedOn: today,
        },
        $inc: { coins },
      }
    ),
  ]);

  return NextResponse.json({
    title: task.title,
    stats: task.stats,
    xp,
    coins,
    level,
    levelsGained,
    streak,
  });
}
