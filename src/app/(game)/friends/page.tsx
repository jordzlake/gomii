import { ObjectId } from "mongodb";
import { currentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { achievementFeed, friendIds, friendList, pendingRequests } from "@/lib/friends";
import TopBar from "@/components/TopBar";
import FriendsBoard from "@/components/FriendsBoard";
import AchievementFeed from "@/components/AchievementFeed";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const user = (await currentUser())!;
  const ids = await friendIds(user.id);

  const [friends, requests, feed] = await Promise.all([
    friendList(user.id),
    pendingRequests(user.id),
    achievementFeed(user.id, [...ids, user.id], 40),
  ]);

  // Opening the log is what marks it read.
  const db = await getDb();
  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(user.id) }, { $set: { friendsSeenAt: new Date() } });

  return (
    <>
      <TopBar user={user} title="Friends" />

      <FriendsBoard
        friends={friends}
        incoming={requests.incoming}
        outgoing={requests.outgoing}
        tracking={user.trackFriends !== false}
      />

      <div className="section-head">
        <h2>Achievement log</h2>
        <span>one-offs and goals</span>
      </div>
      <AchievementFeed
        items={feed}
        emptyLine={
          friends.length === 0
            ? "Add a friend and everything they finish shows up here."
            : "Quiet so far. One-off tasks and finished goals land here, daily chores do not."
        }
      />
    </>
  );
}
