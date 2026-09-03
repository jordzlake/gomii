import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { FriendshipDoc } from "@/lib/friends";

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const db = await getDb();
  const [people, links] = await Promise.all([
    db
      .collection("users")
      .find(
        { username: { $regex: escape(q), $options: "i" }, _id: { $ne: new ObjectId(userId) } },
        { projection: { username: 1, avatarId: 1, level: 1 }, limit: 8 }
      )
      .toArray(),
    db
      .collection<FriendshipDoc>("friendships")
      .find({ $or: [{ requester: userId }, { recipient: userId }] })
      .toArray(),
  ]);

  const known = new Map(
    links.map((l) => [l.requester === userId ? l.recipient : l.requester, l.status])
  );

  return NextResponse.json({
    results: people.map((p) => ({
      id: p._id.toString(),
      username: p.username,
      avatarId: p.avatarId,
      level: p.level ?? 1,
      state: known.get(p._id.toString()) ?? "none",
    })),
  });
}
