import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";

/**
 * Hiding is per player and covers built-in tasks as well as their own, so the
 * key is stored as-is rather than checked against the preset list.
 */
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { key, hidden } = await req.json();
  if (typeof key !== "string" || key.length < 2) {
    return NextResponse.json({ error: "Unknown task." }, { status: 400 });
  }

  const db = await getDb();
  const update = hidden
    ? { $addToSet: { hiddenTasks: key } }
    : { $pull: { hiddenTasks: key } };

  await db.collection("users").updateOne({ _id: new ObjectId(userId) }, update as never);

  return NextResponse.json({ ok: true, hidden: Boolean(hidden) });
}
