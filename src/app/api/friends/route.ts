import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { FriendshipDoc } from "@/lib/friends";

/** Send a request by character name. */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { username } = await req.json();
  const name = String(username ?? "").trim();
  if (name.length < 2) return NextResponse.json({ error: "Enter a character name." }, { status: 400 });

  const db = await getDb();
  const target = await db.collection("users").findOne({ username: name }, { projection: { username: 1 } });
  if (!target) return NextResponse.json({ error: "No character with that name." }, { status: 404 });

  const targetId = target._id.toString();
  if (targetId === userId) {
    return NextResponse.json({ error: "You are already your own best friend." }, { status: 400 });
  }

  const existing = await db.collection<FriendshipDoc>("friendships").findOne({
    $or: [
      { requester: userId, recipient: targetId },
      { requester: targetId, recipient: userId },
    ],
  });

  if (existing?.status === "accepted") {
    return NextResponse.json({ error: "You are already friends." }, { status: 409 });
  }

  // They asked first: treat this as accepting them.
  if (existing?.requester === targetId) {
    await db
      .collection("friendships")
      .updateOne({ _id: existing._id }, { $set: { status: "accepted", acceptedAt: new Date() } });
    return NextResponse.json({ ok: true, accepted: true });
  }

  if (existing) return NextResponse.json({ error: "Request already sent." }, { status: 409 });

  await db.collection("friendships").insertOne({
    requester: userId,
    recipient: targetId,
    status: "pending",
    createdAt: new Date(),
    acceptedAt: null,
  });

  return NextResponse.json({ ok: true });
}

/** Accept an incoming request. */
export async function PATCH(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { id } = await req.json();
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Unknown request." }, { status: 400 });

  const db = await getDb();
  const result = await db
    .collection("friendships")
    .updateOne(
      { _id: new ObjectId(id), recipient: userId, status: "pending" },
      { $set: { status: "accepted", acceptedAt: new Date() } }
    );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "That request is no longer waiting." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

/** Decline a request, cancel one you sent, or remove a friend. */
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const params = new URL(req.url).searchParams;
  const id = params.get("id");
  const friendId = params.get("friendId");

  const db = await getDb();

  if (id && ObjectId.isValid(id)) {
    await db.collection("friendships").deleteOne({
      _id: new ObjectId(id),
      $or: [{ requester: userId }, { recipient: userId }],
    });
    return NextResponse.json({ ok: true });
  }

  if (friendId) {
    await db.collection("friendships").deleteOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to remove." }, { status: 400 });
}
