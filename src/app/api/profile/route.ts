import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { AVATARS } from "@/data/sprites";

export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { avatarId } = await req.json();
  const avatar = AVATARS.find((a) => a.id === avatarId);
  if (!avatar) return NextResponse.json({ error: "Unknown character." }, { status: 400 });

  const db = await getDb();
  await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { avatarId: avatar.id } });
  return NextResponse.json({ ok: true });
}
