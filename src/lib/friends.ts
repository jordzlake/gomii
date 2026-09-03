import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { StatBlock } from "./stats";

export type FriendshipDoc = {
  _id: ObjectId;
  requester: string;
  recipient: string;
  status: "pending" | "accepted";
  createdAt: Date;
  acceptedAt: Date | null;
};

export type CheerDoc = {
  _id: ObjectId;
  completionId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Date;
};

export type FriendSummary = {
  id: string;
  username: string;
  avatarId: string;
  level: number;
  streak: number;
  cheersReceived: number;
};

export type FeedItem = {
  id: string;
  friendId: string;
  username: string;
  avatarId: string;
  title: string;
  category: string;
  stats: Partial<StatBlock>;
  xp: number;
  completedAt: string;
  cheers: number;
  cheered: boolean;
  mine: boolean;
};

const summaryFields = { username: 1, avatarId: 1, level: 1, streak: 1, cheersReceived: 1 };

/** Ids of everyone whose request has been accepted, in either direction. */
export async function friendIds(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .collection<FriendshipDoc>("friendships")
    .find({ status: "accepted", $or: [{ requester: userId }, { recipient: userId }] })
    .toArray();
  return rows.map((r) => (r.requester === userId ? r.recipient : r.requester));
}

async function summaries(ids: string[]): Promise<FriendSummary[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const docs = await db
    .collection("users")
    .find({ _id: { $in: ids.map((i) => new ObjectId(i)) } }, { projection: summaryFields })
    .toArray();
  return docs.map((d) => ({
    id: d._id.toString(),
    username: d.username,
    avatarId: d.avatarId,
    level: d.level ?? 1,
    streak: d.streak ?? 0,
    cheersReceived: d.cheersReceived ?? 0,
  }));
}

export async function friendList(userId: string) {
  return summaries(await friendIds(userId));
}

export async function pendingRequests(userId: string) {
  const db = await getDb();
  const rows = await db
    .collection<FriendshipDoc>("friendships")
    .find({ status: "pending", $or: [{ requester: userId }, { recipient: userId }] })
    .sort({ createdAt: -1 })
    .toArray();

  const people = await summaries(
    rows.map((r) => (r.requester === userId ? r.recipient : r.requester))
  );
  const byId = new Map(people.map((p) => [p.id, p]));

  return {
    incoming: rows
      .filter((r) => r.recipient === userId)
      .map((r) => ({ id: r._id.toString(), person: byId.get(r.requester)! }))
      .filter((r) => r.person),
    outgoing: rows
      .filter((r) => r.requester === userId)
      .map((r) => ({ id: r._id.toString(), person: byId.get(r.recipient)! }))
      .filter((r) => r.person),
  };
}

export async function areFriends(a: string, b: string) {
  const db = await getDb();
  const row = await db.collection<FriendshipDoc>("friendships").findOne({
    status: "accepted",
    $or: [
      { requester: a, recipient: b },
      { requester: b, recipient: a },
    ],
  });
  return Boolean(row);
}

/**
 * Achievements only: one-off tasks and finished goals. Repeating chores are
 * deliberately left out so the log stays worth reading.
 */
export async function achievementFeed(
  viewerId: string,
  ownerIds: string[],
  limit = 40,
  since?: Date | null
) {
  if (ownerIds.length === 0) return [] as FeedItem[];
  const db = await getDb();

  const query: Record<string, unknown> = {
    userId: { $in: ownerIds },
    $or: [{ repeat: "once" }, { category: "Long term goal" }],
  };
  if (since) query.completedAt = { $gt: since };

  const rows = await db
    .collection("completions")
    .find(query)
    .sort({ completedAt: -1 })
    .limit(limit)
    .toArray();

  if (rows.length === 0) return [] as FeedItem[];

  const people = await summaries(Array.from(new Set(rows.map((r) => r.userId as string))));
  const byId = new Map(people.map((p) => [p.id, p]));
  const ids = rows.map((r) => r._id.toString());

  const [counts, mine] = await Promise.all([
    db
      .collection<CheerDoc>("cheers")
      .aggregate<{ _id: string; n: number }>([
        { $match: { completionId: { $in: ids } } },
        { $group: { _id: "$completionId", n: { $sum: 1 } } },
      ])
      .toArray(),
    db.collection<CheerDoc>("cheers").find({ completionId: { $in: ids }, fromUserId: viewerId }).toArray(),
  ]);

  const countBy = new Map(counts.map((c) => [c._id, c.n]));
  const cheeredByMe = new Set(mine.map((c) => c.completionId));

  return rows
    .map((r) => {
      const person = byId.get(r.userId as string);
      if (!person) return null;
      const id = r._id.toString();
      return {
        id,
        friendId: person.id,
        username: person.username,
        avatarId: person.avatarId,
        title: r.title as string,
        category: r.category as string,
        stats: r.stats as Partial<StatBlock>,
        xp: (r.xp as number) ?? 0,
        completedAt: new Date(r.completedAt as Date).toISOString(),
        cheers: countBy.get(id) ?? 0,
        cheered: cheeredByMe.has(id),
        mine: person.id === viewerId,
      } satisfies FeedItem;
    })
    .filter(Boolean) as FeedItem[];
}

/** How many friend achievements landed since the player last opened the log. */
export async function unseenAchievements(userId: string, since: Date | null, ids?: string[]) {
  const owners = ids ?? (await friendIds(userId));
  if (owners.length === 0) return 0;
  const db = await getDb();
  return db.collection("completions").countDocuments({
    userId: { $in: owners },
    $or: [{ repeat: "once" }, { category: "Long term goal" }],
    ...(since ? { completedAt: { $gt: since } } : {}),
  });
}

export async function friendProfile(viewerId: string, friendId: string) {
  if (!ObjectId.isValid(friendId)) return null;
  if (viewerId !== friendId && !(await areFriends(viewerId, friendId))) return null;

  const db = await getDb();
  const doc = await db.collection("users").findOne({ _id: new ObjectId(friendId) });
  if (!doc) return null;

  const [achievements, completedCount] = await Promise.all([
    achievementFeed(viewerId, [friendId], 25),
    db.collection("completions").countDocuments({ userId: friendId }),
  ]);

  return {
    id: friendId,
    username: doc.username as string,
    avatarId: doc.avatarId as string,
    level: (doc.level as number) ?? 1,
    xp: (doc.xp as number) ?? 0,
    streak: (doc.streak as number) ?? 0,
    stats: doc.stats as StatBlock,
    cheersReceived: (doc.cheersReceived as number) ?? 0,
    completedCount,
    achievements,
  };
}
