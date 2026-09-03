import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { areFriends } from "@/lib/friends";

/** Say good job on a friend's achievement. One per achievement, and it sticks. */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { completionId } = await req.json();
  if (!ObjectId.isValid(completionId)) {
    return NextResponse.json({ error: "Unknown achievement." }, { status: 400 });
  }

  const db = await getDb();
  const completion = await db.collection("completions").findOne({ _id: new ObjectId(completionId) });
  if (!completion) return NextResponse.json({ error: "Unknown achievement." }, { status: 404 });

  const owner = completion.userId as string;
  if (owner === userId) {
    return NextResponse.json({ error: "Cheer for someone else." }, { status: 400 });
  }
  if (!(await areFriends(userId, owner))) {
    return NextResponse.json({ error: "You are not friends yet." }, { status: 403 });
  }

  const already = await db
    .collection("cheers")
    .findOne({ completionId: String(completionId), fromUserId: userId });
  if (already) return NextResponse.json({ error: "Already cheered." }, { status: 409 });

  await Promise.all([
    db.collection("cheers").insertOne({
      completionId: String(completionId),
      fromUserId: userId,
      toUserId: owner,
      createdAt: new Date(),
    }),
    db.collection("users").updateOne({ _id: new ObjectId(owner) }, { $inc: { cheersReceived: 1 } }),
  ]);

  const cheers = await db.collection("cheers").countDocuments({ completionId: String(completionId) });
  return NextResponse.json({ ok: true, cheers });
}
