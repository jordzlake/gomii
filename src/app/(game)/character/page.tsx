import { currentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import TopBar from "@/components/TopBar";
import CharacterSheet from "@/components/CharacterSheet";

export const dynamic = "force-dynamic";

export default async function CharacterPage() {
  const user = (await currentUser())!;
  const db = await getDb();
  const completedCount = await db.collection("completions").countDocuments({ userId: user.id });

  return (
    <>
      <TopBar user={user} title="Character" />
      <CharacterSheet
        username={user.username}
        avatarId={user.avatarId}
        level={user.level}
        xp={user.xp}
        coins={user.coins}
        streak={user.streak}
        stats={user.stats}
        completedCount={completedCount}
        cheersReceived={user.cheersReceived ?? 0}
      />
    </>
  );
}
