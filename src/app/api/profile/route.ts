import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { AVATARS } from "@/data/sprites";

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json();
  const update: Record<string, unknown> = {};

  if ("avatarId" in body) {
    const avatar = AVATARS.find((a) => a.id === body.avatarId);
    if (!avatar) return NextResponse.json({ error: "Unknown character." }, { status: 400 });
    update.avatarId = avatar.id;
  }

  if ("trackFriends" in body) {
    update.trackFriends = Boolean(body.trackFriends);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: update });
  return NextResponse.json({ ok: true });
}
